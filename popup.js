var library_search_page_url; // Set in options.html (eg: https://mdpl.ent.sirsi.net/client/catalog/search/advanced)
var library_detail_page_url; // Set in options.html (eg: https://mdpl.ent.sirsi.net/client/catalog/search/detailnonmodal/)
var amazon_url = 'http://www.amazon.com/gp/product/';
var keyword;

document.addEventListener('DOMContentLoaded', function() {
  var searchButton = document.getElementById('search');

  /* Load configuration options then start the scraping */
  searchButton.addEventListener('click', function() {
      keyword = document.getElementById('keyword');
      getConfig(startScrape);
  }, false);
}, false);

function getConfig(callback) {
  chrome.storage.sync.get(['library_search_page_url',
                           'library_detail_page_url'], 
      function(items) {
         var base;
         var hostname;

         library_search_page_url = items['library_search_page_url'];
         library_detail_page_url = items['library_detail_page_url'];

         hostname = library_search_page_url.match(/(https?:\/\/[^\/]+\/)/);
         hostname = hostname[1];

         base = document.getElementsByTagName('base')[0];
         base.href = hostname;

         callback();
      }
  );
}

function startScrape() {
  var xhr;

  xhr = new XMLHttpRequest();
  xhr.open('GET', library_search_page_url, true);
  xhr.onload = submitLibForm;
  xhr.send()
}

/*
 * Search keyword for books written in english 
 */
function submitLibForm()
{
    var form;

    /* Load library's advanced search form */
    document.getElementById("library-search-form").innerHTML = this.responseText;

    /* Search by keyword for English language books */
    form = document.forms.advancedSearchForm;
    form.elements.advancedSearchField.value = keyword.value;
    form.elements.allWordsField.value = keyword.value;
    form.elements.advancedSearchButton.value = 'Advanced Search';
    form.elements.formatTypeDropDown.value = 'BOOK';
    form.elements.languageDropDown.value = 'ENG';

    var formdata = new FormData(form);
    var xhr = new XMLHttpRequest();

    xhr.open('POST', form.action, true);
    xhr.onload = loadLibResults;
    xhr.send(formdata)
}

/*
 * Load results of searching library catalogue into div. Then extract
 * isbn13 numbers of results and search for their Amazon page to get
 * their rating
 */
function loadLibResults()
{
  var result_cells;

  document.getElementById("extension-search-form").style.display = "none";
  document.getElementById("results").innerHTML = this.responseText;

  result_cells = document.querySelectorAll('div[id^=results_cell]');

  for (i = 0; i < result_cells.length; i++) {
      var isbn13 = document.querySelector('#' + result_cells[i].id + ' .isbnValue').value;
      var isbn10 = isbn13to10(isbn13);
      var detailLink = document.getElementById('detailLink' + i);

      /*
       * The links as they stand won't work since they use onclick which is 
       * forbidden in extensions for security reasons. Update the links to
       * each books detail page instead of having a popup.
       */
      var onclick = detailLink.getAttribute('onclick');
      var link = onclick.match(/(ent:.*_ILS:\d+\/\d+\/\d+)\?/);
      var href = library_detail_page_url + link[1];

      detailLink.setAttribute('href', href);
      detailLink.setAttribute('target', '_blank');
      detailLink.removeAttribute('onclick');

      getAmazonRating(isbn10, result_cells[i], detailLink);
  }  
}

/*
 * Needs to reference a particular isbn10 and its corresponding div#results_cell
 */
function getAmazonRating(isbn10, result_cell, detailLink)
{
  var xhr = new XMLHttpRequest();

  /*
   * Extract the rating from the Amazon product page, insert it into the 
   * library search results page and then reorder the results in order
   * of rating.
   */ 
  var extractAmazonRating = function () {
      var avgRatingText,
          avgRating,
          m,
          p; 

      document.getElementById('amazon-response').innerHTML = xhr.responseText;

      avgRatingText = document.getElementById('avgRating').innerText;
      m = avgRatingText.match(/\d+(\.\d+)?/);

      avgRating = parseFloat(m[0]);

      p = document.createElement('p');
      p.innerHTML = avgRating.toString();

      /* 
       * Attach the rating to the library search results and then reorder
       * the search results by Amazon rating
       */
      detailLink.parentElement.appendChild(p);
      rankResultCell(result_cell, avgRating);
  };

  xhr.open('GET', amazon_url + isbn10, true);
  xhr.onload = extractAmazonRating;
  xhr.send();
}

/*
 * Move result cells around so that cells are listed in descending
 * order by Amazom review
 */
function rankResultCell(result_cell, rating)
{
    var i;
    var result_cells = document.getElementsByClassName('results_cell');
    var result_celli_rating; 
    var parent;

    for (i = 0; i < result_cells.length; i++) {
        result_celli_rating = resultCellRating(result_cells[i]);

        if (result_cell !== result_cells[i] && rating > result_celli_rating) {
            parent = result_cells[i].parentNode.parentNode;
            parent.insertBefore(result_cell.parentNode, result_cells[i].parentNode);
            break;
        }
    }
}

/*
 * Return the Amazon rating that was attached to result_cell
 */
function resultCellRating(result_cell)
{
    var idNum = result_cell.id.match(/results_cell(\d+)/);
    var detailLink = document.getElementById('detailLink' + idNum[1]);
    var children = detailLink.parentNode.children;

    if (children.length > 1)
        return parseFloat(children[1].innerText);
    else
        return 0;
}

/*
 * Convert ISBN13 to ISBN10
 */
function isbn13to10(isbn13)
{
    var first9 = (isbn13 + '').slice(3).slice(0, -1);
    var isbn10 = first9 + isbn10_check_digit(first9);
    return isbn10;
}

/*
 * Return the ISBN10 check digit given the first 9 numbers
 */
function isbn10_check_digit(isbn10)
{
    var i = 0;
    var s = 0;
    var v;

    for (n = 10; n > 1; n--) {
        s += n * Number(isbn10[i]);
        i++;
    }

    s = s % 11;
    s = 11 - s;
    v = s % 11;

    if (v == 10)
        return 'x';
    else
        return v + '';
}


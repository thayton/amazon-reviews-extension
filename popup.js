var xhr = new XMLHttpRequest();
var url1 = 'https://mdpl.ent.sirsi.net/client/catalog/search/advanced?';
var url2 = 'https://mdpl.ent.sirsi.net/client/catalog/search/advanced.advancedsearchform';
var amazon_url = 'http://www.amazon.com/gp/product/';

function loadForm()
{
  document.getElementById("search-form").innerHTML = xhr.responseText;
  formSubmit();
}

//
// Return the Amazon rating associated with result_cell
//
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

function rankResultCell(result_cell, rating)
{
    var i;
    var result_cells = document.getElementsByClassName('results_cell');
    var result_celli_rating; 

    for (i = 0; i < result_cells.length; i++) {
	result_celli_rating = resultCellRating(result_cells[i]);

	if (result_cell !== result_cells[i] && rating > result_celli_rating) {
	    result_cells[i].parentNode.insertBefore(result_cell, result_cells[i]);
	    break;
	}
    }
}

//
// Needs to reference a particular isbn10 and its corresponding
// div#results_cell
//
function getAmazonReview(isbn10, result_cell, detailLink)
{
  var xhr = new XMLHttpRequest();
  var extractAmazonReview = function () {
      document.getElementById('amazon-response').innerHTML = xhr.responseText;
      var rating_text = document.getElementById('avgRating').innerText;
      var m = rating_text.match(/\d+(\.\d+)?/);
      var rating = parseFloat(m[0]);
      var p = document.createElement('p');

      p.innerHTML = '' + rating;
      detailLink.parentElement.appendChild(p);

      rankResultCell(result_cell, rating);

      console.log('Rating for ' + isbn10 + ' is ' + rating); 
  };

  xhr.open('GET', amazon_url + isbn10, true);
  xhr.onload = extractAmazonReview;
  xhr.send();
}

//
// Load results of searching library catalogue into div. Then extract
// isbn13 numbers of results and search for their Amazon page to get
// their rating
//
function loadResults()
{
  document.getElementById("results").innerHTML = xhr.responseText;
  var result_cells = document.querySelectorAll('div[id^=results_cell]');

  for (i = 0; i < result_cells.length; i++) {
      var isbn13 = document.querySelector('#' + result_cells[i].id + ' .isbnValue').value;
      var isbn10 = isbn13to10(isbn13);
      var detailLink = document.getElementById('detailLink' + i);

      //
      // The links as they stand won't work since they use onclick which is 
      // forbidden in extensions for security reasons. Update the links to
      // each books detail page instead of having a popup.
      //
      var onclick = detailLink.getAttribute('onclick');
      var link = onclick.match(/(ent:.*_ILS:\d+\/\d+\/\d+)\?/);
      var href = 'https://mdpl.ent.sirsi.net/client/catalog/search/detailnonmodal/' + link[1];

      detailLink.setAttribute('href', href);
      detailLink.setAttribute('target', '_blank');
      detailLink.removeAttribute('onclick');

      console.log(isbn13);
      console.log(isbn10);

      getAmazonReview(isbn10, result_cells[i], detailLink);
  }  
}

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

function isbn13to10(isbn13)
{
    var first9 = (isbn13 + '').slice(3).slice(0, -1);
    var isbn10 = first9 + isbn10_check_digit(first9);
    return isbn10;
}

function formSubmit()
{
    var form = document.forms.advancedSearchForm;

    form.elements.advancedSearchField.value = 'javascript';
    form.elements.allWordsField.value = 'javascript';
    form.elements.advancedSearchButton.value = 'Advanced Search';
    form.elements.formatTypeDropDown.value = 'BOOK';
    form.elements.languageDropDown.value = 'ENG';

    var formdata = new FormData(form);

    xhr.open('POST', url2, true);
    xhr.onload = loadResults;
    xhr.send(formdata)
}

document.addEventListener('DOMContentLoaded', function() {
  var checkPageButton = document.getElementById('checkPage');
  checkPageButton.addEventListener('click', function() {

    xhr.open('GET', url1, true);
    xhr.onload = loadForm;
    xhr.send()
  }, false);
}, false);
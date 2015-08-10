// Saves options to chrome.storage
function save_options() {
    var library_search_page_url = document.getElementById('library_search_page_url').value;
    var library_detail_page_url = document.getElementById('library_detail_page_url').value;

    chrome.storage.sync.set({
      library_search_page_url: library_search_page_url,
      library_detail_page_url: library_detail_page_url
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
	      status.textContent = '';
      }, 750);
   });
}

function restore_options() {
  chrome.storage.sync.get({
    library_search_page_url: 'https://mdpl.ent.sirsi.net/client/catalog/search/advanced',
    library_detail_page_url: 'https://mdpl.ent.sirsi.net/client/catalog/search/detailnonmodal/'
  }, function(items) {
    document.getElementById('library_search_page_url').value = items.library_search_page_url;
    document.getElementById('library_detail_page_url').value = items.library_detail_page_url;
  });  
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
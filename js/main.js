"use strict";

function document_ready(callback) {
  // in case the document is already rendered
  if (document.readyState != 'loading') callback();
  // modern browsers
  else if (document.addEventListener) document.addEventListener('DOMContentLoaded', callback);
  // IE <= 8
  else document.attachEvent('onreadystatechange', function() {
    if (document.readyState == 'complete') callback();
  });
}
// Main
document_ready(function() {
  console.log("Ready");
  
  var coll = document.getElementsByClassName("collapsible");
  var i;
  for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.display === "flex") {
        content.style.display = "none";
      } else {
        content.style.display = "flex";
      }
    });
  }


  const url_params = new URLSearchParams(window.location.search);
  if (url_params.has("p")) {
    var current_page = parseInt(url_params.get("p"));
  } else {
    var current_page = 1;
  }

  let filter = {};
  if (url_params.has("q")) {
    filter["q"] = url_params.get("q");
    document.getElementById("query_filter").value = url_params.get("q");
  }
  if (url_params.has("d")) {
    filter["d"] = url_params.get("d");
    document.getElementById("date_filter").value = url_params.get("d");
  } else {
    let cur_date = new Date(Date.now());
    document.getElementById("date_filter").value = "*-" + String(cur_date.getMonth() + 1).padStart(2, 0) + "-" + String(cur_date.getDate()).padStart(2, 0);
  }

  var tweets = prep_tweets(filter);
  make_bars(tweets, filter);

  if (url_params.has("d") || url_params.has("q")) {
    document.getElementById("info").innerHTML = "Found " + Object.keys(tweets).length + " tweets matching the filter.";
  } else {
    document.getElementById("info").innerHTML = "Found " + Object.keys(tweets).length + " tweets.";
  }

  let nav_href = [];
  if (url_params.has("d")) {
    nav_href.push("d=" + url_params.get("d"))
  }
  if (url_params.has("q")) {
    nav_href.push("q=" + url_params.get("q"))
  }
  if (nav_href.length != 0) {
    nav_href = "&" + nav_href.join("&")
  } else {
    nav_href = nav_href.join("&")
  }
  document.getElementById("next_page").href = "?p=" + (current_page + 1) + nav_href;
  document.getElementById("prev_page").href = "?p=" + (current_page - 1) + nav_href;

  document.getElementById("cur_page").innerHTML = current_page;
  document.getElementById("max_page").innerHTML = Math.ceil(tweets.length / tweets_per_page);

  document.title = "Indexing " + Object.keys(tweets).length + " Tweets by " + user_name;
  document.getElementById("top_link").children[0].innerText = "Tweets by " + user_name;

  let start_slice = (current_page - 1) * tweets_per_page;
  let end_slice = (current_page) * tweets_per_page;
  let page_tweets = tweets_to_html(tweets.slice(start_slice, end_slice));
  page_tweets.forEach(function(item) {
    document.getElementById("tweets").appendChild(item);
  });
});
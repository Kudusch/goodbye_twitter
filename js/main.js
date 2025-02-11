"use strict";

function document_ready(callback) {
  // in case the document is already rendered
  if (document.readyState != "loading") callback();
  // modern browsers
  else if (document.addEventListener)
    document.addEventListener("DOMContentLoaded", callback);
  // IE <= 8
  else
    document.attachEvent("onreadystatechange", function () {
      if (document.readyState == "complete") callback();
    });
}

function sync_settings() {
  if (localStorage.getItem("include_replies") !== null) {
    document.getElementById("include_replies").checked =
      localStorage.getItem("include_replies") === "true";
    include_replies = localStorage.getItem("include_replies") === "true";
  } else {
    document.getElementById("include_replies").checked = include_replies;
  }

  if (localStorage.getItem("sort_direction") !== null) {
    document.getElementById("sort_direction").value =
      localStorage.getItem("sort_direction");
    sort_direction = localStorage.getItem("sort_direction");
  } else {
    document.getElementById("sort_direction").value = sort_direction;
  }

  if (localStorage.getItem("tweets_per_page") !== null) {
    document.getElementById("tweets_per_page").value =
      localStorage.getItem("tweets_per_page");
    tweets_per_page = localStorage.getItem("tweets_per_page");
  } else {
    document.getElementById("tweets_per_page").value = tweets_per_page;
  }
}

// Main
document_ready(function () {
  console.log("Ready");
  /* Sync settings */
  sync_settings();
  document.title =
    "Indexing " + window.YTD.tweets.part0.filter(function (tweet) {
    return !tweet["tweet"]["full_text"].startsWith("RT @");
  }).length + " Tweets by " + user_name;

  document
    .querySelectorAll("#settings input, #settings select")
    .forEach((el) => {
      el.addEventListener("change", function () {
        if (el.type == "checkbox") {
          localStorage.setItem(el.id, el.checked);
        } else {
          localStorage.setItem(el.id, el.value);
        }
        window.location.reload();
      });
    });

  var coll = document.getElementsByClassName("collapser");
  var i;
  for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
      if (this.children.item(1).style.fontStyle == "italic") {
        this.children.item(1).style.fontStyle = "normal";
      } else {
        this.children.item(1).style.fontStyle = "italic";
      }

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
  }
  if (url_params.has("id")) {
    filter["id"] = url_params.get("id");
  }

  var tweets = prep_tweets(filter);
  make_bars(tweets, filter);

  if (url_params.has("d") || url_params.has("q")) {
    document.getElementById("info").innerHTML =
      "Found " + Object.keys(tweets).length + " tweets matching the filter.";
  } else if (url_params.has("id")) {
    document.getElementById("info").style.display = "none";
    document.getElementById("bars").style.display = "none";
    document.getElementById("bars-info").style.display = "none";
    document.getElementById("filter").style.display = "none";
    document.getElementById("filter_button").style.display = "none";
    document.getElementsByClassName("collapser")[0].style.display = "none";
    document.getElementById("settings").style.display = "none";
    document.getElementsByTagName("nav")[0].style.display = "none";
  } else {
    document.getElementById("info").innerHTML =
      "Found " + Object.keys(tweets).length + " tweets.";
  }

  document.getElementById("otd").onclick = function () {
    let cur_date = new Date(Date.now());
    window.location.href =
      window.location.href +
      "?d=*-" +
      String(cur_date.getMonth() + 1).padStart(2, 0) +
      "-" +
      String(cur_date.getDate()).padStart(2, 0);
  };

  let nav_href = [];
  if (url_params.has("d")) {
    nav_href.push("d=" + url_params.get("d"));
  }
  if (url_params.has("q")) {
    nav_href.push("q=" + url_params.get("q"));
  }
  if (nav_href.length != 0) {
    nav_href = "&" + nav_href.join("&");
  } else {
    nav_href = nav_href.join("&");
  }
  document.getElementById("next_page").href =
    "?p=" + (current_page + 1) + nav_href;
  document.getElementById("prev_page").href =
    "?p=" + (current_page - 1) + nav_href;

  let max_pages = Math.ceil(tweets.length / tweets_per_page);

  document.getElementById("cur_page").innerHTML = current_page;
  document.getElementById("max_page").innerHTML = max_pages;

  

  if (tweets.length > 0) {
    let start_slice = (current_page - 1) * tweets_per_page;
    let end_slice = current_page * tweets_per_page;
    
    document.getElementById("first_page").href =
      "?p=" + (1) + nav_href;
    document.getElementById("last_page").href =
      "?p=" + (max_pages) + nav_href;
    
    let slice = tweets
    .slice(start_slice, end_slice)
    .filter(t => t.tweet.in_reply_to_user_id_str != "15872417");
    let thread_tweets = tweets
    .slice(start_slice, end_slice)
    .filter(t => t.tweet.in_reply_to_user_id_str == "15872417")
    .sort(function (a, b) {
      return a.tweet.id_str - b.tweet.id_str;
    });
    
    for (let i = 0; i < slice.length - 1; i++) {
      let thread_ids = [slice[i].tweet.id_str];
      thread_tweets.map(t => {
        if (thread_ids.includes(t.tweet.in_reply_to_status_id_str)) {
          slice.splice(i+1, 0, t);
          thread_ids.push(t.tweet.id_str);
          i++;
        }
      });
    }

    let page_tweets = tweets_to_html(slice);
    page_tweets.forEach(function (item) {
      document.getElementById("tweets").appendChild(item);
    });
    if (tweets.length == 1) {
      let thread = get_thread([url_params.get("id")]);
      if (thread.length > 0) {
        let sep = document.createElement("hr");
        sep.dataset.content = "Thread continued …";
        sep.classList.add("hr-thread");
        document.getElementById("tweets").appendChild(sep);
        tweets_to_html(thread).forEach(function (item) {
          document.getElementById("tweets").appendChild(item);
        });
      }
    }
    if (current_page == 1) {
      document.getElementsByTagName("nav")[0].children[0].style.display = "none";
      document.getElementsByTagName("nav")[0].children[1].style.display = "none";
    } else if (current_page >= max_pages) {
        document.getElementsByTagName("nav")[0].children[3].style.display = "none";
        document.getElementsByTagName("nav")[0].children[4].style.display = "none";
    }
  } else {
    document.getElementById("bars").style.display = "none";
    document.getElementById("bars-info").style.display = "none";
    document.getElementById("settings").style.display = "none";
    document.getElementsByTagName("nav")[0].style.display = "none";
    let error_message = document.createElement("div");
    //error_message.classList.add("retweet");
    //error_message.innerHTML = "<p>No tweets found</p>";
    //document.getElementById("tweets").appendChild(error_message);
  }
});

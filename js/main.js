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

function tweets_to_html(tweets) {
    let html = [];
    for (let i = 0; i < tweets.length; i++) {
        let tweet = tweets[i]["tweet"];
        console.log(tweet);
        let article = document.createElement("article");
        let tweet_text = document.createElement("p");
        let tweet_time = document.createElement("p");
        let tweet_meta = document.createElement("p");
        let tweet_author = document.createElement("p");
        if (tweet["full_text"].startsWith("RT @")) {
            article.classList.add("retweet");
            tweet_text.innerText = tweet["full_text"].split(": ")[1];
            tweet_author.innerText = "@" + tweet["full_text"].split(": ")[0].substring(4);
        } else {
            article.classList.add("tweet");
            tweet_text.innerText = tweet["full_text"];
            tweet_author.innerText = "@Kudusch";
        }
        tweet_time.innerText = tweet["created_at"];
        tweet_meta.innerText = tweet["id_str"];
        article.append(tweet_text);
        article.append(tweet_time);
        article.append(tweet_meta);
        article.append(tweet_author);
        html.push(article);
    }
    return html;
}

document_ready(function() {
    console.log("Ready");
    
    let tweets = window.YTD.tweets.part0;
    
    if (sort_direction == "asc") {
        tweets.sort(function(a, b) {
            let a_time =  Date.parse(a["tweet"]["created_at"]);
            let b_time = Date.parse(b["tweet"]["created_at"]);
            return a_time-b_time;
        });
    } else if (sort_direction == "desc") {
        tweets.sort(function(a, b) {
            let a_time =  Date.parse(a["tweet"]["created_at"]);
            let b_time = Date.parse(b["tweet"]["created_at"]);
            return b_time-a_time;
        });
    }
    
    if (!include_retweets) {
        tweets = tweets.filter(function (tweet) {
            return !tweet["tweet"]["full_text"].startsWith("RT @");
        });
    }
    if (!include_replies) {
        tweets = tweets.filter(function (tweet) {
            return !tweet["tweet"]["full_text"].startsWith("@");
        });
    }
    
    const url_params = new URLSearchParams(window.location.search);
    const cur_page = parseInt(url_params.get("p"));
    document.getElementById("cur_page").innerHTML = cur_page;
    document.getElementById("max_page").innerHTML = Math.ceil(tweets.length / tweets_per_page);
    document.getElementById("next_page").href = "?p=" + (cur_page+1);
    document.getElementById("prev_page").href = "?p=" + (cur_page-1);
    
    document.title = "Indexing " + Object.keys(tweets).length + " Tweets by " + user_name;
    document.getElementsByTagName("header")[0].innerHTML = "<h1>Indexing " + Object.keys(tweets).length + " Tweets by " + user_name + "</h1>";
    document.getElementById("info").innerHTML = "There are " + Object.keys(tweets).length + " tweets.";
    let start_slice = (cur_page - 1 ) * tweets_per_page;
    let end_slice = (cur_page) * tweets_per_page;
    let page_tweets = tweets_to_html(tweets.slice(start_slice, end_slice));
    page_tweets.forEach(function(item) {
        document.getElementById("tweets").appendChild(item);
    });
});
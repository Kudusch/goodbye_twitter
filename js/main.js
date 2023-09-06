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

function parse_entities(tweet) {
    console.log(tweet);
    let raw_entities = [];
    if ("entities" in tweet) {
        Object.entries(tweet.entities).forEach(function(item) {
            let key = item[0];
            let entities = item[1];
            if (entities.length != 0) {
                entities.forEach(function(entity) {
                    let parsed_entity = {
                        "start":parseInt(entity.indices[0]),
                        "end":parseInt(entity.indices[1]),
                        "len":parseInt(entity.indices[1]) - parseInt(entity.indices[0])
                    };
                    if (key == "urls") {
                        parsed_entity.replacement = "<a href='" + entity.expanded_url + "'>" + entity.display_url + "</a>";
                    } else if (key == "hashtags") {
                        parsed_entity.replacement = "<a href='?q=hashtag:" + entity.text + "'>" + entity.text + "</a>";
                    } else if (key == "media") {
                        parsed_entity.replacement = "<img src='data/tweets_media/" + tweet.id + "-" + entity.media_url.split("/").slice(-1) + "'>";
                    } else if (key == "user_mentions") {
                        parsed_entity.replacement = "<a href='https://twitter.com/" + entity.screen_name + "'>@" + entity.screen_name + "</a>";
                    }
                    raw_entities.push(parsed_entity);
                });
            }
        });
    }
    
    raw_entities.sort(function(a, b) {
        return a.start-b.start;
    });
    return raw_entities;
}

function as_datetime(s) {
    let d = new Date(s);
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2, 0) + "-" + String(d.getDate()).padStart(2, 0) + " " + String(d.getHours()).padStart(2, 0) + ":" + String(d.getMinutes()).padStart(2, 0)
}

function enrich_text(tweet) {
    let offset = 0;
    let entities = parse_entities(tweet);
    let text = tweet.full_text;
    entities.forEach(function(item) {
        text = text.substring(0, item.start+offset) + item.replacement + text.substring(item.end+offset);
        offset += item.replacement.length - item.len;
    });
    return text;
}

function tweet_to_html(tweet) {
    let full_text = enrich_text(tweet);
    
    let article = document.createElement("article");
    let tweet_text = document.createElement("p");
    let tweet_time = document.createElement("p");
    let tweet_meta = document.createElement("p");
    let tweet_author = document.createElement("p");
    if (tweet.full_text.startsWith("RT @")) {
        article.classList.add("retweet");
        tweet_text.innerHTML = full_text.split(": ")[1];
        tweet_author.innerText = "@" + full_text.split(": ")[0].substring(4);
    } else {
        article.classList.add("tweet");
        tweet_text.innerHTML = full_text;
        tweet_author.innerText = "Posted by @Kudusch";
    }
    
    tweet_time.innerText = as_datetime(tweet.created_at);
    tweet_time.classList.add("datetime");
    // tweet_meta.innerText = tweet.id_str;
    // tweet_meta.classList.add("meta");
    article.append(tweet_text);
    article.append(tweet_author);
    article.append(tweet_time);
    // article.append(tweet_meta);
    return article;
}

function tweets_to_html(tweets) {
    let html = [];
    for (let i = 0; i < tweets.length; i++) {
        let tweet = tweets[i]["tweet"];
        html.push(tweet_to_html(tweet));
    }
    return html;
}

function prep_tweets(filter) {
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
    console.log(filter);
    if (!(filter === undefined)) {
        console.log(filter);
        tweets = tweets.filter(function (tweet) {
            return tweet["tweet"]["full_text"].includes(filter);
        });
    }
    return tweets;
}

document_ready(function() {
    console.log("Ready");
    
    const url_params = new URLSearchParams(window.location.search);
    if (url_params.has("p")) {
        var current_page = parseInt(url_params.get("p"));
    } else {
        var current_page = 1;
    }
    
    if (url_params.has("q")) {
        var tweets = prep_tweets(url_params.get("q"));
        document.getElementById("info").innerHTML = "There are " + Object.keys(tweets).length + " tweets matching <i>" + url_params.get("q") + "</i>";
        document.getElementById("next_page").href = "?p=" + (current_page+1) + "&q=" + url_params.get("q");
        document.getElementById("prev_page").href = "?p=" + (current_page-1) + "&q=" + url_params.get("q");
    } else {
        var tweets = prep_tweets();
        document.getElementById("info").innerHTML = "There are " + Object.keys(tweets).length + " tweets.";
        document.getElementById("next_page").href = "?p=" + (current_page+1);
        document.getElementById("prev_page").href = "?p=" + (current_page-1);
    }
    document.getElementById("cur_page").innerHTML = current_page;
    document.getElementById("max_page").innerHTML = Math.ceil(tweets.length / tweets_per_page);
    
    document.title = "Indexing " + Object.keys(tweets).length + " Tweets by " + user_name;
    document.getElementsByTagName("header")[0].children[0].innerHTML = "<h1>Indexing " + Object.keys(tweets).length + " Tweets by " + user_name + "</h1>";
    
    
    let start_slice = (current_page - 1 ) * tweets_per_page;
    let end_slice = (current_page) * tweets_per_page;
    let page_tweets = tweets_to_html(tweets.slice(start_slice, end_slice));
    page_tweets.forEach(function(item) {
        document.getElementById("tweets").appendChild(item);
    });
});
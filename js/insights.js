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

function get_hashtags(tweets) {
    var all_hashtags = tweets.map(function(tweet) {
      let a = [];
      tweet.tweet.entities.hashtags.forEach(hashtag => {
        a.push(hashtag.text);
      });
      return a;
    }).filter(function(hashtags) {
      return hashtags.length != 0;
    }).flat();
    let counts = {};
    all_hashtags.forEach(el => {
      counts[el.toLowerCase()] = (counts[el.toLowerCase()] || 0) + 1;
    })
    var hashtags = Object.keys(counts).map(function(key) {
      return [key, counts[key]];
    });
    return hashtags.sort(function(a, b) {
      return b[1] - a[1];
    });
}

function get_mentions(tweets) {
    var all_mentions = tweets.map(function(tweet) {
      let a = [];
      tweet.tweet.entities.user_mentions.forEach(mention => {
        a.push(mention.screen_name);
      });
      return a;
    }).filter(function(mentions) {
      return mentions.length != 0;
    }).flat();
    let counts = {};
    all_mentions.forEach(el => {
      counts[el.toLowerCase()] = (counts[el.toLowerCase()] || 0) + 1;
    })
    var mentions = Object.keys(counts).map(function(key) {
      return [key, counts[key]];
    });
    return mentions.sort(function(a, b) {
      return b[1] - a[1];
    });
}

function get_domains(tweets) {
    var all_urls = tweets.map(function(tweet) {
      let a = [];
      tweet.tweet.entities.urls.forEach(url => {
        let domain = (new URL(url.expanded_url));
        a.push(domain.hostname);
      });
      return a;
    }).filter(function(url) {
      return url.length != 0;
    }).flat();
    let counts = {};
    all_urls.forEach(el => {
      counts[el.toLowerCase()] = (counts[el.toLowerCase()] || 0) + 1;
    })
    var urls = Object.keys(counts).map(function(key) {
      return [key, counts[key]];
    });
    return urls.sort(function(a, b) {
      return b[1] - a[1];
    });
}

function get_metrics(tweets) {
    var all_metrics = tweets.map(function(tweet) {
      return {"id":tweet.tweet.id_str, "retweet_count":parseInt(tweet.tweet.retweet_count), "favorite_count":parseInt(tweet.tweet.favorite_count)};
    }).sort(function(a, b) {
      return (b.favorite_count + b.retweet_count) - (a.favorite_count + a.retweet_count);
    });
    
    let top_fav = all_metrics.sort((a, b) => {return b.favorite_count - a.favorite_count}).map(t => t.id).slice(0, 10);
    let top_rt = all_metrics.sort((a, b) => {return b.retweet_count - a.retweet_count}).map(t => t.id).slice(0, 10);
    
    var total_favs = all_metrics.map(function(tweet) {
      return parseInt(tweet.favorite_count);
    }).reduce((partial_sum, a) => partial_sum + a,0);
    var total_retweets = all_metrics.map(function(tweet) {
      return parseInt(tweet.retweet_count);
    }).reduce((partial_sum, a) => partial_sum + a,0);
    
    top_fav = tweets.filter(tweet => {return top_fav.indexOf(tweet.tweet.id_str) > -1});
    top_rt = tweets.filter(tweet => {return top_rt.indexOf(tweet.tweet.id_str) > -1});
    
    return {"total_favs":total_favs, "total_retweets":total_retweets, "top_fav":top_fav, "top_rt":top_rt};
}

function get_top_words(tweets) {
  let all_words = tweets.map(tweet => {
    return tweet.tweet.full_text.toLowerCase().replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').split(/[^a-z0-9üöäß]/);
  }).flat().filter(token => {
    if (token.match(/[0-9\s]/) || token == "") {
      return false;
    } else {
      return true;
    }
  });
  let counts = {};
  all_words.forEach(el => {
    counts[el] = (counts[el] || 0) + 1;
  });
  var tokens = Object.keys(counts).map(function(key) {
    return [key, counts[key]];
  });
  return tokens.sort(function(a, b) {
    return b[1] - a[1];
  });
  return tokens;
}

function get_tod(tweets) {
  var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
  
    let all_hours = tweets.map(tweet => {
      let d = new Date(tweet.tweet.created_at);
      return String((d.getHours()+utc_offset)%24).padStart(2, 0);
      });
    var counts = {};
    all_hours.forEach(el => {
      counts[el.toLowerCase()] = (counts[el.toLowerCase()] || 0) + 1;
    })
    var hours = Object.keys(counts).map(function(key) {
      return [key, counts[key]];
    }).sort();
    
    let all_minutes = tweets.map(tweet => {
      let d = new Date(tweet.tweet.created_at);
      return String(d.getMinutes()).padStart(2, 0);
      });
    var counts = {};
    all_minutes.forEach(el => {
      counts[el.toLowerCase()] = (counts[el.toLowerCase()] || 0) + 1;
    });
    var minutes = Object.keys(counts).map(function(key) {
      return [key, counts[key]];
    }).sort();
    
    return([hours, minutes]);
}

// Main
document_ready(function() {
  console.log("Ready");

  var tweets = prep_tweets({});
  make_bars(tweets, {});
  document.querySelectorAll(".bar").forEach((node) => {node.onclick = undefined;})
  
  let hashtag_table = document.getElementById("hashtag_table").children[1];
  var n = 1;
  get_hashtags(tweets).slice(1, 16).forEach(hashtag => {
    let row = document.createElement("tr");
    row.innerHTML = "<td>" + n + "</td><td><a href='/?q=%23" + hashtag[0] + "'>#" + hashtag[0] + "</a></td><td>" + hashtag[1] + "</td>";
    hashtag_table.append(row);
    n = n+1;
  });
  
  let mention_table = document.getElementById("mention_table").children[1];
  var n = 1;
  get_mentions(tweets).slice(1, 16).forEach(mention => {
    let row = document.createElement("tr");
    row.innerHTML = "<td>" + n + "</td><td><a href='/?q=@" + mention[0] + "'>@" + mention[0] + "</a></td><td>" + mention[1] + "</td>";
    mention_table.append(row);
    n = n+1;
  });
  
  let domain_table = document.getElementById("domain_table").children[1];
  var n = 1;
  get_domains(tweets).slice(1, 16).forEach(url => {
    console.log()
    let row = document.createElement("tr");
    row.innerHTML = "<td>" + n + "</td><td><a href='/?q=" + url[0] + "'>" + url[0] + "</a></td><td>" + url[1] + "</td>";
    domain_table.append(row);
    n = n+1;
  });
  
  let metrics = get_metrics(tweets);
  tweets_to_html(metrics.top_fav).forEach(function(item) {
    document.getElementById("top_fav").appendChild(item);
  });
  tweets_to_html(metrics.top_rt).forEach(function(item) {
    document.getElementById("top_rt").appendChild(item);
  });
  
  let top_words = document.getElementById("top_words");
  get_top_words(tweets).slice(0, 50).forEach(token => {
    let bubble = document.createElement("div");
    bubble.innerText = token[0];
    bubble.dataset.count = token[1];
    bubble.style = "font-size: " + token[1]/100 + "pt;";
    top_words.append(bubble);
  })
  
  let time_counts = get_tod(tweets);
  let max_count = Math.max(...time_counts[0].map(x => x[1]));
  time_counts[0].forEach(entry => {
    const [key, value] = entry;
    var bar = document.createElement("div");
    bar.style = "height:" + (value / max_count) * 100 + "%; width: " + (1 / time_counts[0].length) * 100 + "%;";
    bar.classList.add("tod_bar");
    bar.dataset.name = key;
    bar.dataset.count = value;
    bar.innerHTML = "<span>" + key + "</span>";
    tod.append(bar);
  });
  
  
  let info_text = document.getElementById("info");
  let p = document.createElement("p");
  p.innerHTML = "Your tweets received a total of <b>" + metrics.total_favs + " favourites</b> and <b>" + metrics.total_retweets + " retweets</b>.";
  info_text.append(p);
});
function parse_entities(tweet) {
  let raw_entities = [];
  if ("entities" in tweet) {
    Object.entries(tweet.entities).forEach(function (item) {
      let key = item[0];
      let entities = item[1];
      if (entities.length != 0) {
        entities.forEach(function (entity) {
          let parsed_entity = {
            start: parseInt(entity.indices[0]),
            end: parseInt(entity.indices[1]),
            len: parseInt(entity.indices[1]) - parseInt(entity.indices[0]),
          };
          if (key == "urls") {
            parsed_entity.replacement =
              "<a href='" +
              entity.expanded_url +
              "'>" +
              entity.display_url +
              "</a>";
          } else if (key == "hashtags") {
            parsed_entity.replacement =
              "<a href='?q=%23" + entity.text + "'>#" + entity.text + "</a>";
          } else if (key == "media") {
            parsed_entity.replacement =
              "<img src='data/tweets_media/" +
              tweet.id +
              "-" +
              entity.media_url.split("/").slice(-1) +
              "'>";
          } else if (key == "user_mentions") {
            parsed_entity.replacement =
              "<a href='https://twitter.com/" +
              entity.screen_name +
              "'>@" +
              entity.screen_name +
              "</a>";
          }
          raw_entities.push(parsed_entity);
        });
      }
    });
  }
  if ("extended_entities" in tweet) {
    Object.entries(tweet.extended_entities).forEach(function (item) {
      let key = item[0];
      let entities = item[1];
      if (entities.length != 0) {
        entities.forEach(function (entity) {
          let parsed_entity = {
            start: parseInt(entity.indices[0]),
            end: parseInt(entity.indices[1]),
            len: parseInt(entity.indices[1]) - parseInt(entity.indices[0]),
          };
          if (key == "urls") {
            parsed_entity.replacement =
              "<a href='" +
              entity.expanded_url +
              "'>" +
              entity.display_url +
              "</a>";
          } else if (key == "hashtags") {
            parsed_entity.replacement =
              "<a href='?q=%23" + entity.text + "'>#" + entity.text + "</a>";
          } else if (key == "media") {
            if (entity.type == "animated_gif" || entity.type == "video") {
              let media_file =
                tweet.id_str +
                "-" +
                entity.video_info.variants
                  .sort((a, b) => {
                    return b.bitrate - a.bitrate;
                  })[0]
                  .url.split("/")
                  .slice(-1)[0]
                  .split("?")[0];
              parsed_entity.replacement =
                "<br><video autoplay loop muted><source src='data/tweets_media/" +
                media_file +
                "' type='" +
                entity.video_info.variants[
                  entity.video_info.variants.length - 1
                ].content_type +
                "' /></video>";
            } else {
              parsed_entity.replacement =
                "<img src='data/tweets_media/" +
                tweet.id +
                "-" +
                entity.media_url.split("/").slice(-1) +
                "'>";
            }
          } else if (key == "user_mentions") {
            parsed_entity.replacement =
              "<a href='https://twitter.com/" +
              entity.screen_name +
              "'>@" +
              entity.screen_name +
              "</a>";
          }
          raw_entities = raw_entities.filter((entry) => {
            return (
              entry.start != parsed_entity.start &&
              entry.end != parsed_entity.end
            );
          });
          raw_entities.push(parsed_entity);
        });
      }
    });
  }

  raw_entities.sort(function (a, b) {
    return a.start - b.start;
  });
  return raw_entities;
}

function as_datetime(s) {
  let d = new Date(s);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, 0) +
    "-" +
    String(d.getDate()).padStart(2, 0) +
    " " +
    String(d.getHours()).padStart(2, 0) +
    ":" +
    String(d.getMinutes()).padStart(2, 0)
  );
}

function enrich_text(tweet) {
  let offset = 0;
  let entities = parse_entities(tweet);
  let text = tweet.full_text;
  entities.forEach(function (item) {
    text =
      Array.from(text)
        .slice(0, item.start + offset)
        .join("") +
      item.replacement +
      Array.from(text)
        .slice(item.end + offset)
        .join("");
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
  } else if ("in_reply_to_status_id_str" in tweet) {
    article.classList.add("reply");
    tweet_text.innerHTML = full_text;
    tweet_author.innerHTML =
      "In reply to <a href='https://twitter.com/" +
      tweet.in_reply_to_screen_name +
      "/statuses/" +
      tweet.in_reply_to_status_id_str +
      "'>@" +
      tweet.in_reply_to_screen_name +
      "</a>";
  } else {
    article.classList.add("tweet");
    tweet_text.innerHTML = full_text;
    tweet_author.innerText = "Posted by @" + user_name;
  }

  tweet_time.innerHTML =
    "<a href='https://twitter.com/" +
    user_name +
    "/statuses/" +
    tweet.id_str +
    "'>" +
    as_datetime(tweet.created_at) +
    "</a> <span><a href='index.html?id=" +
    tweet.id_str +
    "'>🔗</a></span><span onclick='tweet_to_img(this)'>🌄</span>";
  tweet_time.classList.add("datetime");
  tweet_meta.innerHTML =
    "<div class='favorite_count'><div>" +
    tweet.favorite_count +
    "</div><div class='fav_icon'></div></div> <div class='favorite_count'><div>" +
    tweet.retweet_count +
    "</div><div class='rt_icon'></div></div>";
  tweet_meta.classList.add("meta");
  article.append(tweet_text);
  article.append(tweet_author);
  article.append(tweet_meta);
  article.append(tweet_time);
  article.dataset.id = tweet.id_str;
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

function tweet_to_img(el) {
  let tweet = el.parentNode.parentNode;
  domtoimage.toPng(tweet).then(function (dataUrl) {
    var link = document.createElement("a");
    link.download = "my-image-name.png";
    link.href = dataUrl;
    link.click();
  });
}

function get_thread(thread_ids) {
  let tweets = window.YTD.tweets.part0
    .filter(function (tweet) {
      return !tweet["tweet"]["full_text"].startsWith("RT @");
    })
    .sort(function (a, b) {
      return a.tweet.id_str - b.tweet.id_str;
    })
    .filter((tweet) => {
      if (thread_ids.includes(tweet.tweet.in_reply_to_status_id_str)) {
        thread_ids.push(tweet.tweet.id_str);
        return true;
      } else {
        return false;
      }
    });
  return tweets;
}

function prep_tweets(filter) {
  let tweets = window.YTD.tweets.part0.filter(function (tweet) {
    return !tweet["tweet"]["full_text"].startsWith("RT @");
  });
  if (!include_replies) {
    tweets = tweets.filter(function (tweet) {
      return !tweet["tweet"]["full_text"].startsWith("@");
    });
  }
  if (Object.keys(filter).length != 0) {
    if ("id" in filter) {
      tweets = tweets.filter(function (tweet) {
        return tweet.tweet.id_str == filter.id;
      });
      return tweets;
    }
    if ("q" in filter) {
      tweets = tweets.filter(function (tweet) {
        return tweet["tweet"]["full_text"]
          .toLowerCase()
          .includes(filter.q.toLowerCase());
      });
    }
    if ("d" in filter) {
      tweets = tweets.filter(function (tweet) {
        let filter_date = filter.d.split("-");
        let y = filter_date[0],
          m = filter_date[1],
          d = filter_date[2];

        let tweet_date = new Date(tweet["tweet"]["created_at"]);
        let y_tweet = tweet_date.getFullYear(),
          m_tweet = tweet_date.getMonth() + 1,
          d_tweet = tweet_date.getDate();

        let y_check = y == "*" || y == y_tweet;
        let m_check = m == "*" || m == m_tweet;
        let d_check = d == "*" || d == d_tweet;

        if (y_check && m_check && d_check) {
          return true;
        } else {
          return false;
        }
      });
    }
  }
  if (sort_direction == "asc") {
    tweets.sort(function (a, b) {
      let a_time = Date.parse(a["tweet"]["created_at"]);
      let b_time = Date.parse(b["tweet"]["created_at"]);
      return a_time - b_time;
    });
  } else if (sort_direction == "desc") {
    tweets.sort(function (a, b) {
      let a_time = Date.parse(a["tweet"]["created_at"]);
      let b_time = Date.parse(b["tweet"]["created_at"]);
      return b_time - a_time;
    });
  }
  return tweets;
}

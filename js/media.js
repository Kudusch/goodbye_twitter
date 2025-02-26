"use strict";

var max_slice = 0;
var tweets = [];

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

document.addEventListener('mousemove', function(ev){
    document.getElementById('larger').style.transform = 'translateY('+(ev.clientY-290)+'px)';
    console.log(ev.clientX <= (window.innerWidth/2));
    if (ev.clientX <= (window.innerWidth/2)) {
      document.getElementById('larger').style.transform += 'translateX('+(ev.clientX+10)+'px)';
  } else {
    document.getElementById('larger').style.transform += 'translateX('+(ev.clientX-510)+'px)';
  }
},false);

window.onscroll = function (e) {  
let larger = document.getElementById("larger");
larger.style.opacity = 0;
} 

function gallery_mouseMove(event) {  
  let larger = document.getElementById("larger");
  larger.children[0].src = this.children[0].src;
  larger.style = "display: block";
}

function gallery_mouseOver() {
  this.style.display = "block";
}
function gallery_mouseOut() {
    let larger = document.getElementById("larger");
    larger.style.opacity = 0;
}
function gallery_click() {
    window.location.href = "index.html?id=" + this.dataset.id;
}

function get_media(tweets) {
//function get_media(tweets, start, stop) {
    //let media_tweets = tweets.slice(start, stop).filter(tweet => {
    let media_tweets = tweets.filter(tweet => {
      tweet = tweet.tweet;
      if ("entities" in tweet) {
        if ("media" in tweet.entities) {
          if (tweet.entities.media.length > 0) {
            return true;
        }
      }
    }
      return false;
    });
    return media_tweets;
}

function load_more() {
    let media_tweets = get_media(tweets, max_slice, max_slice+100);
    max_slice += 100
    
    tweets_to_html(media_tweets).forEach(function(item) {
      let img = item.children[0].getElementsByTagName("img")[0];
      if (img) {
        var media = document.createElement("div");
        media.classList.add("mm-columns__item");
        media.classList.add("media");
        img.classList.add("mm-columns__img");
        media.appendChild(img);
        media.onmouseover = gallery_mouseOver;
        media.onmouseout = gallery_mouseOut;
        media.onmousemove = gallery_mouseMove;
        media.onclick = gallery_click;
        media.dataset.id = item.dataset.id;
        document.getElementById("gallery").appendChild(media);
        }
    });
}

document_ready(function() {
  console.log("Ready");

  tweets = prep_tweets({});
  make_bars(tweets, {});
  document.querySelectorAll(".bar").forEach((node) => {
    node.onclick = undefined;
  });
  
  let media_tweets = get_media(tweets);
  //let media_tweets = get_media(tweets, max_slice, max_slice+100);
  //max_slice += 100
  
  tweets_to_html(media_tweets).forEach(function(item) {
    let img = item.children[0].getElementsByTagName("img")[0];
    if (img) {
      var media = document.createElement("div");
      media.classList.add("mm-columns__item");
      media.classList.add("media");
      img.classList.add("mm-columns__img");
      media.appendChild(img);
      media.onmouseover = gallery_mouseOver;
      media.onmouseout = gallery_mouseOut;
      media.onmousemove = gallery_mouseMove;
      media.onclick = gallery_click;
      media.dataset.id = item.dataset.id;
      document.getElementById("gallery").appendChild(media);
      }
  });

});
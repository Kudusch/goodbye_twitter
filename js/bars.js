function as_ym(s) {
	let d = new Date(s);
	return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, 0);
}

function as_ymd(s) {
	let d = new Date(s);
	return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, 0) + "-" + String(d.getDate()).padStart(2, 0);
}

function as_hh(s) {
	let d = new Date(s);
	return String(d.getHours()).padStart(2, 0);
}
// https://stackoverflow.com/questions/1184334/get-number-days-in-a-specified-month-using-javascript
function days_in_month(month, year) {
	return new Date(year, month, 0).getDate();
}

// https://stackoverflow.com/questions/54673408/get-max-min-from-array-of-strings-javascript
function get_range(arr) {
	if (!arr) {
		return null;
	}
	var minV = arr[0];
	var maxV = arr[0];
	arr.forEach(a => {
		if (a < minV) minV = a;
		if (a > maxV) maxV = a;
	});
	return [parseInt(minV.split(("-")[0])), parseInt(maxV.split(("-")[0]))];
}

function type_from_filter(filter) {
	let split_filter = filter.d.split("-");
	if (
		split_filter[0] != "*" &&
		split_filter[1] != "*" &&
		split_filter[2] == "*"
	) {
		return "month";
	} else if (
		split_filter[0] != "*" &&
		split_filter[1] != "*" &&
		split_filter[2] != "*"
	) {
		return "day";
	} else {
		return "other";
	}
}

function year_month_from_filter(filter) {
	let split_filter = filter.d.split("-");
	return [split_filter[0], split_filter[1]];
}

/* Bar Events */
function bar_mouseOver() {
	let tooltip = document.getElementById("tooltip");
	tooltip.innerText = this.dataset.name + ": " + this.dataset.count;
	this.classList.add("active");
}

function bar_mouseOut() {
	let tooltip = document.getElementById("tooltip");
	tooltip.innerText = "";
	this.classList.remove("active");
}

function bar_click() {
	if (this.dataset.type == "month") {
		window.location.href = "?d=" + this.dataset.name;
	} else if (this.dataset.type == "all") {
		window.location.href = "?d=" + this.dataset.name + "-*";
	}
}


function make_bars(tweets, filter) {
	if ("d" in filter) {
		var type = type_from_filter(filter);
		if (type == "month") {
			var all_dates = tweets.map(function(tweet) {
				return as_ymd(tweet.tweet.created_at);
			});
		} else if (type == "day") {
			var all_dates = tweets.map(function(tweet) {
				return as_hh(tweet.tweet.created_at);
			});
		}
	} else {
		var all_dates = tweets.map(function(tweet) {
			return as_ym(tweet.tweet.created_at);
		});
		var type = "all";
	}
	console.log(type);

	let bar_counts = {};
	all_dates.forEach(el => {
		bar_counts[el] = (bar_counts[el] || 0) + 1;
	})

	if (type == "all") {
		let bar_range = get_range(Object.keys(bar_counts));
		for (var y = bar_range[0]; y <= bar_range[1]; y++) {
			for (var m = 1; m <= 12; m++) {
				let k = y + "-" + String(m).padStart(2, 0);
				if (!(k in bar_counts)) {
					bar_counts[k] = 0;
				}
			}
		}
	} else if (type == "month") {
		let year_month = year_month_from_filter(filter);
		let y = year_month[0];
		let m = year_month[1];
		for (var d = 1; d <= days_in_month(y, m); d++) {
			let k = y + "-" + String(m).padStart(2, 0) + "-" + String(d).padStart(2, 0);
			console.log(d);
			if (!(k in bar_counts)) {
				bar_counts[k] = 0;
			}
		}
	} else if (type == "day") {
		for (var h = 1; h <= 24; h++) {
			let k = String(h).padStart(2, 0);
			if (!(k in bar_counts)) {
				bar_counts[k] = 0;
			}
		}
	}
	let max_count = Object.values(bar_counts).reduce((a, b) => Math.max(a, b), -Infinity);

	let bars = document.getElementById("bars");
	Object.keys(bar_counts).sort().forEach(k => {
		var bar = document.createElement("div");
		bar.style = "height:" + (bar_counts[k] / max_count) * 100 + "%; width: " + (1 / Object.keys(bar_counts).length) * 100 + "%;";
		bar.classList.add("bar");
		bar.onmouseover = bar_mouseOver;
		bar.onmouseout = bar_mouseOut;
		bar.onclick = bar_click;
		bar.dataset.name = k;
		bar.dataset.type = type;
		bar.dataset.count = bar_counts[k];
		bars.append(bar);
	});
}
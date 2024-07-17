//  'vol', 'page', 'doi', 'submission time', 'acceptance time', 'publication time', 'funding'

// let host_url = 'http://10.206.32.47:5739';
// let host_url = 'http://10.206.32.47:5739';
// let host_url = 'http://127.0.0.1:5739';
let host_url = 'http://82.156.12.45:9202';

function table_entry(idx) {
  return `<div style="display:inline-block;width:calc(50% - 80px);padding:10px">
    <input id="auth${idx}-input" type="text" dir="ltr" spellcheck=false autocorrect="off" autocomplete="off"
      autocapitalize="off" maxlength="2048" tabindex="1">
  </div>
  <div style="display:inline-block;width:calc(50% - 80px);padding:10px">
    <div class="autoComplete_wrapper" role="combobox" aria-haspopup="true" aria-expanded="false"><input
        id="raw${idx}-input" type="text" dir="ltr" spellcheck="false" autocorrect="off" autocomplete="off"
        autocapitalize="off" maxlength="2048" tabindex="1" style="width:100%" aria-autocomplete="both" placeholder="raw name #${idx + 1}">
    </div>
  </div>
  <div class="items-center" style="display: inline-block;height:100%;vertical-align:middle;padding:10px 10px 10px 10px">
  <table style="display:inline">
  <tbody>
  <tr><td>
    <input type="checkbox" id="corresp${idx}" style="width:auto !important;vertical-align: middle;">
    <label for="corresp${idx}" style="color:rgb(119, 66, 141);vertical-align: middle;">corresponding</label>
  </td></tr>
  <tr><td> 
    <input type="checkbox" id="co-first${idx}" style="width:auto !important;vertical-align: middle;">
    <label for="co-first${idx}" style="color:rgb(119, 66, 141);vertical-align: middle;">co-first</label>
  </td></tr>
  </tbody>
  </table>
  </div>
  </div>`;
}
/*
<div class="autoComplete_wrapper" role="combobox" aria-haspopup="true" aria-expanded="false"><input
        id="note${idx}-input" type="text" dir="ltr" spellcheck="false" autocorrect="off" autocomplete="off"
        autocapitalize="off" maxlength="2048" tabindex="1" style="width:100%" aria-autocomplete="both" placeholder="note #${idx + 1}">
        
  // <div style="display:inline-block;width:calc(100% - 510px);padding:10px">
  //   <input id="note${idx}-input" type="text" dir="ltr" spellcheck=false autocorrect="off" autocomplete="off"
  //     autocapitalize="off" maxlength="2048" tabindex="1">
  //   </div>
*/

let resultItem = {
  element: (item, data) => {
    // console.log(data);
    item.style = "display: flex; justify-content: space-between;";
    let sup = data.value.id ? `<sup style="color: rgba(0,0,0,.2)">${data.value.id}</sup>` : "";
    item.innerHTML = `
    <span style="white-space: initial;">
      ${data.match}
      ${sup}
    </span>
    <span style="display: flex; align-items: center; font-size: 13px; font-weight: 100; text-transform: uppercase; color: rgba(0,0,0,.2);">
      ${data.key}
    </span>`;
  },
  highlight: true,
}, resultsList = {
  element: (list, data) => {
    const info = document.createElement("p");
    info.style.cssText = "text-align:center";
    if (data.results.length) {
      info.innerHTML = `Displaying <strong>${data.results.length}</strong> out of <strong>${data.matches.length}</strong> results`;
    } else {
      info.innerHTML = `Found <strong>${data.matches.length}</strong> matching results for <strong>"${data.query}"</strong>`;
    }
    list.prepend(info);
  },
  noResults: true,
  maxResults: 15,
  tabSelect: true,
};

$.get({
  async: false,
  url: host_url + "/index",
  success: function (data) {
    indexfiles = data;
  }
});

let selected_pub;
function set_selection_pub(item) {
  if (item) {
    document.getElementById("pub-input").value = item.name;
    selected_pub = item;
    $.ajax({
      type: "POST",
      url: host_url + "/pubrank",
      data: { pub: item.id },
      success: function (data) {
        let s = '';
        const display_name = {
          "ccf": "CCF",
          "core_conf": "CORE",
          "ccf_cn": "CCF中文",
        }
        for (let i of ["ccf", "core_conf", "ccf_cn"]) {
          if (i in data) {
            s += `<span style="padding-left: 5px;padding-right: 5px;"><a class="f6 br-pill ba ph3 pv2 mb2 dib purple"
          style="padding: 4px;border-radius: 5px;">${display_name[i] + ' ' + data[i]}</a></span>`;
          }
        }
        if ('sci' in data) {
          s += `<span style="padding-left: 5px;padding-right: 5px;"><a class="f6 br-pill ba ph3 pv2 mb2 dib purple"
        style="padding: 4px;border-radius: 5px;">${data['sci'][0]} ${data['sci'][1]} 区${data['sci'][2] == 'Y' ? ' Top' : ''}</a></span>`;
        }
        if ('sci_sub' in data) {
          for (let i of data['sci_sub']) {
            s += `<span style="padding-left: 5px;padding-right: 5px;"><a class="f6 br-pill ba ph3 pv2 mb2 dib purple"
          style="padding: 4px;border-radius: 5px;">${i[0]} ${i[1]} 区</a></span>`;
          }
        }
        $('#pub-rank-info').html(s.substring(0, s.length - 2));
        $('#pub-rank-info-wrapper').css('display', 'block');
      }
    });
    if (document.getElementById(`raw-pub-input`).value == "") {
      document.getElementById(`raw-pub-input`).value = item.name;
    }
  } else {
    selected_pub = undefined;
    $('#pub-rank-info-wrapper').css('display', 'none');
  }
}

let selected_paper;
function set_selection_paper(item) {
  if (item) {
    $.ajax({
      type: "POST",
      url: host_url + "/getpaper",
      data: { id: item.id },
      success: function (data) {
        console.log(data);
        load_paper_data(JSON.stringify(data));
      }
    });
    selected_paper = item.id;
    $('#save-btn').css('visibility', 'visible');
  } else {
    selected_paper = undefined;
    $('#save-btn').css('visibility', 'hidden');
  }
}

const title_input_ac = new autoComplete({
  selector: "#title-input",
  data: {
    src: indexfiles['papers'],
    keys: ["id", "title"],
    cache: true,
  },
  placeHolder: "title",
  resultsList: resultsList,
  resultItem: resultItem,
  searchEngine: "strict",
  events: {
    input: {
      focus() {
        if (title_input_ac.input.value.length) {
          title_input_ac.start();
        }
      },
      input() {
        set_selection_paper(undefined);
        if (title_input_ac.input.value.length) {
          title_input_ac.start();
        }
      },
      selection(event) {
        set_selection_paper(event.detail.selection.value);
      },
    },
  },
}), chinese_title_input_ac = new autoComplete({
  selector: "#cn-title-input",
  data: {
    src: indexfiles['papers'],
    keys: ["id", "chinese title"],
    cache: true,
  },
  placeHolder: "CN title",
  resultsList: resultsList,
  resultItem: resultItem,
  searchEngine: "strict",
  events: {
    input: {
      focus() {
        if (chinese_title_input_ac.input.value.length) {
          chinese_title_input_ac.start();
        }
      },
      input() {
        if (chinese_title_input_ac.input.value.length) {
          chinese_title_input_ac.start();
        }
      },
      selection(event) {
        set_selection_paper(event.detail.selection.value);
      },
    },
  },
});


const pubInput = new autoComplete({
  selector: "#pub-input",
  data: {
    src: indexfiles['publications'],
    keys: ["id", "name"],
    cache: true,
  },
  placeHolder: "publication",
  resultsList: resultsList,
  resultItem: resultItem,
  searchEngine: "strict",
  events: {
    input: {
      focus() {
        pubInput.input.style.color = '#7b7b7b';
        if (pubInput.input.value.length) {
          pubInput.start();
        }
      },
      input() {
        set_selection_pub(undefined);
        if (pubInput.input.value.length) {
          pubInput.start();
        }
      },
      focusout() {
        console.log('focusout');
        if (selected_pub == undefined && pubInput.input.value.length) {
          pubInput.input.style.color = 'red';
        }
      },
      selection(event) {
        set_selection_pub(event.detail.selection.value);
      },
    },
  },
});

let auth_cnt = 0;
let person_ac = new Array(0);
let selected_auth = {};
function set_selection_people(i, which, item) {
  if (item) {
    // console.log(which, item);
    // document.getElementById(`auth${i}-input`).value = item[which];
    document.getElementById(`auth${i}-input`).value = item.en + ' ' + item.cn;
    if (document.getElementById(`raw${i}-input`).value === '')
      document.getElementById(`raw${i}-input`).value = item[which];
    // document.getElementById(`note${i}-input`).value = cn;
    selected_auth[i] = { id: item.id, name: item[which] };
  } else {
    selected_auth[i] = undefined;
  }
}

function init_person_input(i) {
  person_ac[i] = new autoComplete({
    selector: `#auth${i}-input`,
    data: {
      src: indexfiles['people'],
      keys: ["id", "en", "cn"],
    },
    placeHolder: `name #${i + 1}`,
    resultsList: resultsList,
    resultItem: resultItem,
    searchEngine: "strict",

    events: {
      input: {
        focus() {
          person_ac[i].input.style.color = '#7b7b7b';
          if (person_ac[i].input.value.length) {
            person_ac[i].start();
          }
        },
        input() {
          set_selection_people(i);
          if (person_ac[i].input.value.length) {
            person_ac[i].start();
          }
        },
        focusout() {
          console.log('focusout');
          if ((!(i in selected_auth) || selected_auth[i] == undefined) && person_ac[i].input.value.length) {
            person_ac[i].input.style.color = 'red';
          }
        },
        selection(event) {
          const feedback = event.detail;
          set_selection_people(i, feedback.selection.key, feedback.selection.value);
        },
      },
    },
  });
}


function add_people() {
  // console.log('add_people');
  let x = document.createElement("tr");
  x.innerHTML = `<td>${table_entry(auth_cnt)}</td>`;
  document.getElementById("authors-table").appendChild(x);
  person_ac.push(null);
  init_person_input(auth_cnt);
  auth_cnt++;
}


let funding_ac = new Array(0), grant_ac = new Array(0), funding_cnt = 0, selected_funding = {};

function set_selection_funding(i, item) {
  // console.log(item);
  if (item) {
    let arr = item.name.split(', grant no. ');
    if (arr.length > 1) {
      document.getElementById(`funding${i}-input`).value = arr[0];
      document.getElementById(`grant${i}-input`).value = arr[1];
      selected_funding[i] = arr;
    } else {
      document.getElementById(`funding${i}-input`).value = item.name;
      selected_funding[i] = [item.name];
    }
  } else {
    selected_funding[i] = undefined;
  }
}

function init_funding_input(i) {
  funding_ac[i] = new autoComplete({
    selector: `#funding${i}-input`,
    data: {
      src: indexfiles['funding-title'],
      keys: ["name"],
      cache: true,
    },
    placeHolder: `funding #${i + 1}`,
    resultsList: resultsList,
    resultItem: resultItem,
    searchEngine: "strict",

    events: {
      input: {
        focus() {
          funding_ac[i].input.style.color = '#7b7b7b';
          if (funding_ac[i].input.value.length) {
            funding_ac[i].start();
          }
        },
        input() {
          console.log('123');
          set_selection_funding(i);
          if (funding_ac[i].input.value.length) {
            funding_ac[i].start();
          }
        },
        focusout() {
          console.log('focusout');
          if ((!(i in selected_funding) || selected_funding[i] == undefined) && funding_ac[i].input.value.length) {
            funding_ac[i].input.style.color = 'red';
          }
        },
        selection(event) {
          const feedback = event.detail;
          set_selection_funding(i, feedback.selection.value);
        },
      },
    },
  });
  grant_ac[i] = new autoComplete({
    selector: `#grant${i}-input`,
    data: {
      src: indexfiles['funding'],
      keys: ["name"],
      cache: true,
    },
    placeHolder: `grant #${i + 1}`,
    resultsList: resultsList,
    resultItem: resultItem,
    searchEngine: "strict",

    events: {
      input: {
        focus() {
          grant_ac[i].input.style.color = '#7b7b7b';
          if (grant_ac[i].input.value.length) {
            grant_ac[i].start();
          }
        },
        input() {
          console.log('123');
          set_selection_funding(i);
          if (grant_ac[i].input.value.length) {
            grant_ac[i].start();
          }
        },
        focusout() {
          console.log('focusout');
        },
        selection(event) {
          const feedback = event.detail;
          grant_ac[i].input.blur();
          set_selection_funding(i, feedback.selection.value);
        },
      },
    },
  });
}

function add_funding() {
  let x = document.createElement("tr");
  x.innerHTML = `<td><div style="display:inline-block;width:500px;padding:10px">
    <div class="autoComplete_wrapper" role="combobox" aria-haspopup="true" aria-expanded="false"><input
        id="funding${funding_cnt}-input" type="text" dir="ltr" spellcheck="false" autocorrect="off" autocomplete="off"
        autocapitalize="off" maxlength="2048" tabindex="1" style="width:100%" aria-autocomplete="both" placeholder="funding #${funding_cnt + 1}">
    </div>
  </div>
  <div style="display:inline-block;width:calc(100% - 510px);padding:10px">
    <div class="autoComplete_wrapper" role="combobox" aria-haspopup="true" aria-expanded="false"><input
        id="grant${funding_cnt}-input" type="text" dir="ltr" spellcheck="false" autocorrect="off" autocomplete="off"
        autocapitalize="off" maxlength="2048" tabindex="1" style="width:100%" aria-autocomplete="both" placeholder="grant #${funding_cnt + 1}">
    </div>
  </div></td>`;
  document.getElementById("fundings-table").appendChild(x);
  funding_ac.push(null);
  grant_ac.push(null);
  init_funding_input(funding_cnt);
  funding_cnt += 1;
}

for (let i = 0; i < 0; ++i) {
  add_people();
  add_funding();
}

function switch_to(x) {
  if (x == 1) {
    document.getElementById("author-funding-entry").style.opacity = 0;
    document.getElementById("paper-info-entry").style.opacity = 1;
    setTimeout(() => {
      document.getElementById("author-funding-entry").style.display = "none";
      document.getElementById("paper-info-entry").style.display = "block";
    }, 300);
  } else {
    save_draft();
    document.getElementById("author-funding-entry").style.opacity = 1;
    document.getElementById("paper-info-entry").style.opacity = 0;
    setTimeout(() => {
      document.getElementById("author-funding-entry").style.display = "block";
      document.getElementById("paper-info-entry").style.display = "none";
    }, 300);
  }
}

setTimeout(() => {
  $('#paper-info-entry').css('display', 'block');
}, 100);

function gather_paper_info() {
  let authors = [];
  for (let i = 0; i < auth_cnt; ++i) {
    if (i in selected_auth && selected_auth[i] != undefined) {
      authors.push({
        "id": selected_auth[i].id,
        "name": selected_auth[i].name,
        "raw": document.getElementById(`raw${i}-input`).value,
        "corresp": document.getElementById(`corresp${i}`).checked,
        "co-first": document.getElementById(`co-first${i}`).checked,
      });
    }
  }

  let fundings = [];
  console.log(selected_funding);
  for (let i = 0; i < funding_cnt; ++i) {
    if (i in selected_funding && selected_funding[i] != undefined) {
      fundings.push({
        "name": selected_funding[i][0],
        "grant": selected_funding[i].length > 1 ? selected_funding[i][1] : ""
      });
    }
  }
  console.log(selected_pub);

  return {
    "title": document.getElementById("title-input").value,
    "CN title": document.getElementById("cn-title-input").value,
    "pub": selected_pub,
    "raw-pub": document.getElementById("raw-pub-input").value,
    "authors": authors,
    "eq-contrb": document.getElementById("eq-contrb").checked,
    "fundings": fundings,
    "submtime": document.getElementById("submtime-input").value,
    "actime": document.getElementById("actime-input").value,
    "pubtime": document.getElementById("pubtime-input").value,
    "vol": document.getElementById("volume-input").value,
    "issue": document.getElementById("issue-input").value,
    "page-start": document.getElementById("page-start").value,
    "page-end": document.getElementById("page-end").value,
  };
}

function submit_paper() {
  let data = gather_paper_info();
  console.log(data);
  $.ajax({
    type: "POST",
    url: host_url + "/addpaper",
    data: { data: JSON.stringify(data) },
    success: function (data) {
      console.log(data);
      // reload_ac();
      localStorage.removeItem("paper-info");
      location.reload();
    }
  });
}

function reload_ac() {
  // $.get({
  //   async: false,
  //   url: host+'/index',
  //   success: function (data) {
  //     indexfiles = data;
  //   }
  // });

  // for (let i = 0; i < auth_cnt; ++i) {
  //   init_person_input(i);
  // }
  // for (let i = 0; i < funding_cnt; ++i) {
  //   init_funding_input(i);
  // }
  // init_new_fund_title_ac();

  // refresh page
  location.reload();
}

function submit_author() {
  let data = {
    "enname": document.getElementById("auth-en-input").value,
    "cnname": document.getElementById("auth-cn-input").value
  };

  $.ajax({
    type: "POST",
    url: host_url + "/addauthor",
    data: data,
    success: function (data) {
      console.log(data);
      reload_ac();
    }
  });
}

let new_fund_title_ac;
function init_new_fund_title_ac() {
  new_fund_title_ac = new autoComplete({
    selector: `#fund-title-input`,
    data: {
      src: indexfiles["funding-title"],
      keys: ["name"],
      cache: true,
    },
    placeHolder: `funding title`,
    resultsList: resultsList,
    resultItem: resultItem,
    searchEngine: "strict",

    events: {
      input: {
        focus() {
          if (new_fund_title_ac.input.value.length) {
            new_fund_title_ac.start();
          }
        },
        selection(event) {
          const feedback = event.detail;
          new_fund_title_ac.input.blur();
          document.getElementById("fund-title-input").value = feedback.selection.value.name;
        },
      },
    },
  });
}
init_new_fund_title_ac();

function submit_funding() {
  let data = {
    "title": document.getElementById("fund-title-input").value,
  };
  $.ajax({
    type: "POST",
    url: host_url + "/addfund",
    data: data,
    success: function (data) {
      console.log(data);
      reload_ac();
    }
  });
}


function load_paper_data(data) {
  data = JSON.parse(data);
  console.log(data);
  if (data == null) return;
  $('#title-input').val(data.title);
  $('#cn-title-input').val(data["CN title"]);
  $('#raw-pub-input').val(data["raw-pub"]);
  $('#authors-table').html("");
  $('#fundings-table').html("");
  auth_cnt = 0;
  funding_cnt = 0;

  set_selection_pub(data.pub);
  for (let i = 0; i < data.authors.length; ++i) {
    if (i == auth_cnt) add_people();
    $(`#auth${i}-input`).val(data.authors[i].id);
    $(`#raw${i}-input`).val(data.authors[i].raw);
    // $(`#note${i}-input`).val(data.authors[i].note);
    if (data.authors[i].corresp) {
      document.getElementById(`corresp${i}`).checked = true;
    }
    if (data.authors[i]["co-first"]) {
      document.getElementById(`co-first${i}`).checked = true;
    }
    let author_entry;
    for (let a of indexfiles['people']) {
      if (a.id == data.authors[i].id) {
        author_entry = a;
        break;
      }
    }
    set_selection_people(i, 'en', author_entry);
  }
  for (let i = 0; i < data.fundings.length; ++i) {
    if (i == funding_cnt) add_funding();
    $(`#funding${i}-input`).val(data.fundings[i].name);
    $(`#grant${i}-input`).val(data.fundings[i].grant);
    let full = data.fundings[i].name;
    if (data.fundings[i].grant) {
      full += ', grant no. ' + data.fundings[i].grant;
    }
    set_selection_funding(i, { name: full });
  }
  if (data["eq-contrb"]) {
    document.getElementById("eq-contrb").checked = true;
  }
  $('#submtime-input').val(data.submtime);
  $('#actime-input').val(data.actime);
  $('#pubtime-input').val(data.pubtime);
  $('#volume-input').val(data.vol);
  $('#issue-input').val(data.issue);
  $('#page-start').val(data["page-start"]);
  $('#page-end').val(data["page-end"]);
}

function save_draft() {
  localStorage.setItem("paper-info", JSON.stringify(gather_paper_info()));
}


function strftime(sFormat, date) {
  if (!(date instanceof Date)) date = new Date();
  var nDay = date.getDay(),
    nDate = date.getDate(),
    nMonth = date.getMonth(),
    nYear = date.getFullYear(),
    nHour = date.getHours(),
    aDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    aMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    aDayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
    isLeapYear = function () {
      return (nYear % 4 === 0 && nYear % 100 !== 0) || nYear % 400 === 0;
    },
    getThursday = function () {
      var target = new Date(date);
      target.setDate(nDate - ((nDay + 6) % 7) + 3);
      return target;
    },
    zeroPad = function (nNum, nPad) {
      return ('' + (Math.pow(10, nPad) + nNum)).slice(1);
    };
  return sFormat.replace(/%[a-z]/gi, function (sMatch) {
    return {
      '%a': aDays[nDay].slice(0, 3),
      '%A': aDays[nDay],
      '%b': aMonths[nMonth].slice(0, 3),
      '%B': aMonths[nMonth],
      '%c': date.toUTCString(),
      '%C': Math.floor(nYear / 100),
      '%d': zeroPad(nDate, 2),
      '%e': nDate,
      '%F': date.toISOString().slice(0, 10),
      '%G': getThursday().getFullYear(),
      '%g': ('' + getThursday().getFullYear()).slice(2),
      '%H': zeroPad(nHour, 2),
      '%I': zeroPad((nHour + 11) % 12 + 1, 2),
      '%j': zeroPad(aDayCount[nMonth] + nDate + ((nMonth > 1 && isLeapYear()) ? 1 : 0), 3),
      '%k': '' + nHour,
      '%l': (nHour + 11) % 12 + 1,
      '%m': zeroPad(nMonth + 1, 2),
      '%M': zeroPad(date.getMinutes(), 2),
      '%p': (nHour < 12) ? 'AM' : 'PM',
      '%P': (nHour < 12) ? 'am' : 'pm',
      '%s': Math.round(date.getTime() / 1000),
      '%S': zeroPad(date.getSeconds(), 2),
      '%u': nDay || 7,
      '%V': (function () {
        var target = getThursday(),
          n1stThu = target.valueOf();
        target.setMonth(0, 1);
        var nJan1 = target.getDay();
        if (nJan1 !== 4) target.setMonth(0, 1 + ((4 - nJan1) + 7) % 7);
        return zeroPad(1 + Math.ceil((n1stThu - target) / 604800000), 2);
      })(),
      '%w': '' + nDay,
      '%x': date.toLocaleDateString(),
      '%X': date.toLocaleTimeString(),
      '%y': ('' + nYear).slice(2),
      '%Y': nYear,
      '%z': date.toTimeString().replace(/.+GMT([+-]\d+).+/, '$1'),
      '%Z': date.toTimeString().replace(/.+\((.+?)\)$/, '$1')
    }[sMatch] || sMatch;
  });
}

for (let elem of ['#submtime-input', '#actime-input', '#pubtime-input']) {
  console.log(elem);
  $(elem).on('focusout', function () {
    let d = Date.parse($(elem).val());
    console.log(d);
    if (!isNaN(d)) {
      $(elem).val(strftime('%Y-%m-%d', new Date(d)));
    }
  });
}

function save_paper() {
  let data = gather_paper_info();
  console.log(data);
  $.ajax({
    type: "POST",
    url: host_url + "/updatepaper",
    data: {
      id: selected_paper,
      data: JSON.stringify(data)
    },
    success: function (data) {
      console.log(data);
      // reload_ac();
      localStorage.removeItem("paper-info");
      location.reload();
    }
  });
}

function clear_all() {
  localStorage.removeItem("paper-info");
  location.reload();
}

function submit_pub() {
  let data = {
    "name": document.getElementById("publication-name-input").value,
    "alias": document.getElementById("publication-alias-input").value,
    "journal": document.getElementById("journal").checked,
  };

  $.ajax({
    type: "POST",
    url: host_url + "/addpub",
    data: data,
    success: function (data) {
      console.log(data);
      reload_ac();
    }
  });
}

load_paper_data(localStorage.getItem("paper-info"));

// switch_to(0);

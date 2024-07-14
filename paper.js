//  'vol', 'page', 'doi', 'submission time', 'acceptance time', 'publication time', 'funding'
function table_entry(idx) {
  return `<div style="display:inline-block;width:250px;padding:10px">
    <input id="auth${idx}-input" type="text" dir="ltr" spellcheck=false autocorrect="off" autocomplete="off"
      autocapitalize="off" maxlength="2048" tabindex="1">
  </div>
  <div style="display:inline-block;width:250px;padding:10px">
    <div class="autoComplete_wrapper" role="combobox" aria-haspopup="true" aria-expanded="false"><input
        id="raw${idx}-input" type="text" dir="ltr" spellcheck="false" autocorrect="off" autocomplete="off"
        autocapitalize="off" maxlength="2048" tabindex="1" style="width:100%" aria-autocomplete="both" placeholder="raw name #${idx + 1}">
    </div>
  </div>
  <div style="display:inline-block;width:calc(100% - 510px);padding:10px">
    <div class="autoComplete_wrapper" role="combobox" aria-haspopup="true" aria-expanded="false"><input
        id="note${idx}-input" type="text" dir="ltr" spellcheck="false" autocorrect="off" autocomplete="off"
        autocapitalize="off" maxlength="2048" tabindex="1" style="width:100%" aria-autocomplete="both" placeholder="note #${idx + 1}">
    </div>
  </div>`;
}

let resultItem = {
  element: (item, data) => {
    item.style = "display: flex; justify-content: space-between;";
    item.innerHTML = `
    <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
      ${data.match}
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
  url: 'http://127.0.0.1:9202/files/index.json',
  success: function (data) {
    indexfiles = data;
  }
});

// function ac_src(elem_id, placeholder, src) {
//   return async () => {
//     try {
//       document.getElementById(elem_id).setAttribute("placeholder", "Loading...");
//       const source = await fetch('http://127.0.0.1:9202/indexfiles/' + src);
//       const data = await source.json();
//       document.getElementById(elem_id).setAttribute("placeholder", placeholder);
//       return data;
//     } catch (error) {
//       return error;
//     }
//   };
// }

let selected_pub;
function set_selection_pub(item) {
  if (item) {
    document.getElementById("pub-input").value = item.name;
    selected_pub = item.id;
    $.ajax({
      type: "POST",
      url: "http://127.0.0.1:9202/pubrank",
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
  } else {
    selected_pub = undefined;
    $('#pub-rank-info-wrapper').css('display', 'none');
  }
}

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
        if (pubInput.input.value.length) {
          set_selection_pub(undefined);
          pubInput.start();
        }
      },
      selection(event) {
        const feedback = event.detail;
        pubInput.input.blur();
        set_selection_pub(feedback.selection.value);
      },
    },
  },
});

let auth_cnt = 0;
let person_ac = new Array(0);
let selected_auth = {};
function set_selection_people(i, which, item) {
  if (item) {
    console.log(which, item);
    document.getElementById(`auth${i}-input`).value = item[which];
    if (document.getElementById(`raw${i}-input`).value === '')
      document.getElementById(`raw${i}-input`).value = item[which];
    // document.getElementById(`note${i}-input`).value = cn;
    selected_auth[i] = item.id;
  } else {
    selected_auth[i] = undefined;
  }
}

function init_person_input(i) {
  person_ac[i] = new autoComplete({
    selector: `#auth${i}-input`,
    data: {
      src: ac_src(`auth${i}-input`, `name #${i + 1}`, "people.json"),
      keys: ["id", "en", "cn"],
      cache: true,
    },
    placeHolder: `name #${i + 1}`,
    resultsList: resultsList,
    resultItem: resultItem,
    searchEngine: "strict",

    events: {
      input: {
        focus() {
          if (person_ac[i].input.value.length) {
            set_selection_people(i);
            person_ac[i].start();
          }
        },
        selection(event) {
          const feedback = event.detail;
          person_ac[i].input.blur();
          set_selection_people(i, feedback.selection.key, feedback.selection.value);
        },
      },
    },
  });
}


function add_people() {
  console.log('add_people');
  let x = document.createElement("tr");
  x.innerHTML = `<td>${table_entry(auth_cnt)}</td>`;
  document.getElementById("authors-table").appendChild(x);
  person_ac.push(null);
  init_person_input(auth_cnt);
  auth_cnt++;
}


let funding_ac = new Array(0), funding_cnt = 0, selected_funding = {};

function set_selection_funding(i, item) {
  if (item) {
    document.getElementById(`funding${i}-input`).value = item.name;
    selected_funding[i] = item.name;
  } else {
    selected_funding[i] = undefined;
  }
}

function init_funding_input(i) {
  funding_ac[i] = new autoComplete({
    selector: `#funding${i}-input`,
    data: {
      src: ac_src(`funding${i}-input`, `funding #${i + 1}`, "funding.json"),
      keys: ["name"],
      cache: true,
    },
    placeHolder: `funding${i}-input`,
    resultsList: resultsList,
    resultItem: resultItem,
    searchEngine: "strict",

    events: {
      input: {
        focus() {
          if (funding_ac[i].input.value.length) {
            set_selection_funding(i, undefined);
            funding_ac[i].start();
          }
        },
        selection(event) {
          const feedback = event.detail;
          funding_ac[i].input.blur();
          set_selection_funding(i, feedback.selection.value);
        },
      },
    },
  });
}

function add_funding() {
  let x = document.createElement("tr");
  x.innerHTML = `<td><div style="display:inline-block;width:100%;padding:10px">
    <div class="autoComplete_wrapper" role="combobox" aria-haspopup="true" aria-expanded="false"><input
        id="funding${funding_cnt}-input" type="text" dir="ltr" spellcheck="false" autocorrect="off" autocomplete="off"
        autocapitalize="off" maxlength="2048" tabindex="1" style="width:100%" aria-autocomplete="both" placeholder="funding #${funding_cnt + 1}">
    </div>
  </div></td>`;
  document.getElementById("fundings-table").appendChild(x);
  funding_ac.push(null);
  init_funding_input(funding_cnt);
  funding_cnt += 1;
}


for (let i = 0; i < 5; ++i) {
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
    document.getElementById("author-funding-entry").style.opacity = 1;
    document.getElementById("paper-info-entry").style.opacity = 0;
    setTimeout(() => {
      document.getElementById("author-funding-entry").style.display = "block";
      document.getElementById("paper-info-entry").style.display = "none";
    }, 300);
  }
}

switch_to(0);
function submit_paper() {
  let authors = [];
  for (let i = 0; i < auth_cnt; ++i) {
    if (i in selected_auth && selected_auth[i] != undefined) {
      authors.push({
        "id": selected_auth[i],
        "raw": document.getElementById(`raw${i}-input`).value,
        "note": document.getElementById(`note${i}-input`).value
      });
    }
  }

  let fundings = [];
  for (let i = 0; i < funding_cnt; ++i) {
    if (i in selected_funding && selected_funding[i] != undefined) {
      fundings.push({
        "name": selected_funding[i]
      });
    }
  }

  let data = {
    "title": document.getElementById("title-input").value,
    "CN title": document.getElementById("cn-title-input").value,
    "pub": selected_pub,
    "raw-pub": document.getElementById("raw-pub-input").value,
    "authors": authors,
    "eq-contrb": document.getElementById("eq-contrb").checked,
    "fundings": fundings
  };

  console.log(data);
}

function submit_author() {
  let data = {
    "enname": document.getElementById("auth-en-input").value,
    "cnname": document.getElementById("auth-cn-input").value
  };

  $.ajax({
    type: "POST",
    url: "http://127.0.0.1:9202/addauthor",
    data: data,
    success: function (data) {
      console.log(data);
    }
  });
}

let new_fund_title_ac = new autoComplete({
  selector: `#fund-title-input`,
  data: {
    src: ac_src(`fund-title-input`, `funding name`, "funding-title.json"),
    keys: ["name"],
    cache: true,
  },
  placeHolder: `fund-title-input`,
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

function submit_funding() {
  let data = {
    "title": document.getElementById("fund-title-input").value,
    "grant": document.getElementById("fund-grant-input").value
  };
  $.ajax({
    type: "POST",
    url: "http://127.0.0.1:9202/addfund",
    data: data,
    success: function (data) {
      console.log(data);
    }
  });
}

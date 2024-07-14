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

function ac_src(elem_id, placeholder, src) {
  return async () => {
    try {
      document.getElementById(elem_id).setAttribute("placeholder", "Loading...");
      const source = await fetch(src);
      const data = await source.json();
      document.getElementById(elem_id).setAttribute("placeholder", placeholder);
      return data;
    } catch (error) {
      return error;
    }
  };
}

function set_selection_pub(item) {
  console.log(item);
  document.getElementById("pub-input").value = item.name;
}

const pubInput = new autoComplete({
  selector: "#pub-input",
  data: {
    src: ac_src("pub-input", "publication", "./publications.json"),
    keys: ["id", "name"],
    cache: true,
  },
  placeHolder: "publication",
  resultsList: resultsList,
  resultItem: resultItem,
  searchEngine: "loose",
  events: {
    input: {
      focus() {
        if (pubInput.input.value.length) pubInput.start();
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
function set_selection_people(i, which, item) {
  console.log(which, item);
  document.getElementById(`auth${i}-input`).value = item[which];
  if (document.getElementById(`raw${i}-input`).value === '')
    document.getElementById(`raw${i}-input`).value = item[which];
  // document.getElementById(`note${i}-input`).value = cn;
}

function init_person_input(i) {
  person_ac[i] = new autoComplete({
    selector: `#auth${i}-input`,
    data: {
      src: ac_src(`auth${i}-input`, `name #${i + 1}`, "./people.json"),
      keys: ["id", "en", "cn"],
      cache: true,
    },
    placeHolder: `name #${i + 1}`,
    resultsList: resultsList,
    resultItem: resultItem,
    searchEngine: "loose",

    events: {
      input: {
        focus() {
          if (person_ac[i].input.value.length) person_ac[i].start();
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


let funding_ac = new Array(0), funding_cnt = 0;

function set_selection_funding(i, item) {
  console.log(item);
  document.getElementById(`funding${i}-input`).value = item.name;
}

function init_funding_input(i) {
  funding_ac[i] = new autoComplete({
    selector: `#funding${i}-input`,
    data: {
      src: ac_src(`funding${i}-input`, `funding #${i + 1}`, "./funding.json"),
      keys: ["name"],
      cache: true,
    },
    placeHolder: `funding${i}-input`,
    resultsList: resultsList,
    resultItem: resultItem,
    searchEngine: "loose",

    events: {
      input: {
        focus() {
          if (funding_ac[i].input.value.length) funding_ac[i].start();
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
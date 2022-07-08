"use strict";

function Search(menu) {
  this.menu = menu;
  this.$search = document.getElementById('menu-search');
  this.$searchBox = document.getElementById('menu-search-box');
  this.$searchResults = document.getElementById('menu-search-results');
  
  this.loadBiblio();
  
  document.addEventListener('keydown', this.documentKeydown.bind(this));
  
  this.$searchBox.addEventListener('keydown', debounce(this.searchBoxKeydown.bind(this), { stopPropagation: true }));
  this.$searchBox.addEventListener('keyup', debounce(this.searchBoxKeyup.bind(this), { stopPropagation: true }));
}

Search.prototype.loadBiblio = function () {
  var $biblio = document.getElementById('menu-search-biblio');
  if (!$biblio) {
    this.biblio = [];
  } else {
    this.biblio = JSON.parse($biblio.textContent);
    this.biblio.clauses = this.biblio.filter(function (e) { return e.type === 'clause' });
    this.biblio.byId = this.biblio.reduce(function (map, entry) {
      map[entry.id] = entry;
      return map;
    }, {});
  }
}

Search.prototype.documentKeydown = function (e) {
  if (e.keyCode === 191) {
    e.preventDefault();
    e.stopPropagation();
    this.triggerSearch();
  }
}

Search.prototype.searchBoxKeydown = function (e) {
  e.stopPropagation();
  e.preventDefault();
  if (e.keyCode === 191 && e.target.value.length === 0) {
    e.preventDefault();
  } else if (e.keyCode === 13) {
    e.preventDefault();
    this.selectResult();
  }
}

Search.prototype.searchBoxKeyup = function (e) {
  if (e.keyCode === 13 || e.keyCode === 9) {
    return;
  }
  
  this.search(e.target.value);
}


Search.prototype.triggerSearch = function (e) {
  if (this.menu.isVisible()) {
    this._closeAfterSearch = false;
  } else {
    this._closeAfterSearch = true;
    this.menu.show();
  }

  this.$searchBox.focus();
  this.$searchBox.select();
}
// bit 12 - Set if the result starts with searchString
// bits 8-11: 8 - number of chunks multiplied by 2 if cases match, otherwise 1.
// bits 1-7: 127 - length of the entry
// General scheme: prefer case sensitive matches with fewer chunks, and otherwise
// prefer shorter matches.
function relevance(result, searchString) {
  var relevance = 0;
  
  relevance = Math.max(0, 8 - result.match.chunks) << 7;
  
  if (result.match.caseMatch) {
    relevance *= 2;
  }
  
  if (result.match.prefix) {
    relevance += 2048
  }
  
  relevance += Math.max(0, 255 - result.entry.key.length);
  
  return relevance;
}

Search.prototype.search = function (searchString) {
  var s = Date.now();

  if (searchString === '') {
    this.displayResults([]);
    this.hideSearch();
    return;
  } else {
    this.showSearch();
  }
  
  if (searchString.length === 1) {
    this.displayResults([]);
    return;
  }
    
  var results;

  if (/^[\d\.]*$/.test(searchString)) {
    results = this.biblio.clauses.filter(function (clause) {
      return clause.number.substring(0, searchString.length) === searchString;
    }).map(function (clause) {
      return { entry: clause };
    });
  } else {
    results = [];
    
    for (var i = 0; i < this.biblio.length; i++) {
      var entry = this.biblio[i];
      if (!entry.key) {
        // biblio entries without a key aren't searchable
        continue;
      }

      var match = fuzzysearch(searchString, entry.key);
      if (match) {
        results.push({ entry: entry, match: match });
      }
    }
  
    results.forEach(function (result) {
      result.relevance = relevance(result, searchString);
    });
    
    results = results.sort(function (a, b) { return b.relevance - a.relevance });

  }

  if (results.length > 50) {
    results = results.slice(0, 50);
  }
  
  this.displayResults(results);
}
Search.prototype.hideSearch = function () {
  this.$search.classList.remove('active');
}

Search.prototype.showSearch = function () {
  this.$search.classList.add('active');
}

Search.prototype.selectResult = function () {
  var $first = this.$searchResults.querySelector('li:first-child a');

  if ($first) {
    document.location = $first.getAttribute('href');
  }
  
  this.$searchBox.value = '';
  this.$searchBox.blur();
  this.displayResults([]);
  this.hideSearch();

  if (this._closeAfterSearch) {
    this.menu.hide();
  }
}

Search.prototype.displayResults = function (results) {
  if (results.length > 0) {
    this.$searchResults.classList.remove('no-results');
    
    var html = '<ul>';

    results.forEach(function (result) {
      var entry = result.entry;
      var id = entry.id;
      var cssClass = '';
      var text = '';

      if (entry.type === 'clause') {
        var number = entry.number ? entry.number + ' ' : '';
        text = number + entry.key;
        cssClass = 'clause';
        id = entry.id;
      } else if (entry.type === 'production') {
        text = entry.key;
        cssClass = 'prod';
        id = entry.id;  
      } else if (entry.type === 'op') {
        text = entry.key;
        cssClass = 'op';
        id = entry.id || entry.refId;
      } else if (entry.type === 'term') {
        text = entry.key;
        cssClass = 'term';
        id = entry.id || entry.refId;
      }

      if (text) {
        html += '<li class=menu-search-result-' + cssClass + '><a href="#' + id + '">' + text + '</a></li>'
      }
    });

    html += '</ul>'

    this.$searchResults.innerHTML = html;
  } else {
    this.$searchResults.innerHTML = '';
    this.$searchResults.classList.add('no-results');
  }
}


function Menu() {
  this.$toggle = document.getElementById('menu-toggle');
  this.$menu = document.getElementById('menu');
  this.$toc = document.querySelector('menu-toc > ol');
  this.$pins = document.querySelector('#menu-pins');
  this.$pinList = document.getElementById('menu-pins-list');
  this.$toc = document.querySelector('#menu-toc > ol');
  this.$specContainer = document.getElementById('spec-container');
  this.search = new Search(this);
  
  this._pinnedIds = {}; 
  this.loadPinEntries();

  // toggle menu
  this.$toggle.addEventListener('click', this.toggle.bind(this));

  // keydown events for pinned clauses
  document.addEventListener('keydown', this.documentKeydown.bind(this));

  // toc expansion
  var tocItems = this.$menu.querySelectorAll('#menu-toc li');
  for (var i = 0; i < tocItems.length; i++) {
    var $item = tocItems[i];
    $item.addEventListener('click', function($item, event) {
      $item.classList.toggle('active');
      event.stopPropagation();
    }.bind(null, $item));
  }

  // close toc on toc item selection
  var tocLinks = this.$menu.querySelectorAll('#menu-toc li > a');
  for (var i = 0; i < tocLinks.length; i++) {
    var $link = tocLinks[i];
    $link.addEventListener('click', function(event) {
      this.toggle();
      event.stopPropagation();
    }.bind(this));
  }

  // update active clause on scroll
  window.addEventListener('scroll', debounce(this.updateActiveClause.bind(this)));
  this.updateActiveClause();

  // prevent menu scrolling from scrolling the body
  this.$toc.addEventListener('wheel', function (e) {
    var target = e.currentTarget;
    var offTop = e.deltaY < 0 && target.scrollTop === 0;
    if (offTop) {
      e.preventDefault();
    }
    var offBottom = e.deltaY > 0
                    && target.offsetHeight + target.scrollTop >= target.scrollHeight;

    if (offBottom) {
		  e.preventDefault();
	  }
  })
}

Menu.prototype.documentKeydown = function (e) {
  e.stopPropagation();
  if (e.keyCode === 80) {
    this.togglePinEntry();
  } else if (e.keyCode > 48 && e.keyCode < 58) {
    this.selectPin(e.keyCode - 49);
  }
}

Menu.prototype.updateActiveClause = function () {
  this.setActiveClause(findActiveClause(this.$specContainer))
}

Menu.prototype.setActiveClause = function (clause) {
  this.$activeClause = clause;
  this.revealInToc(this.$activeClause);
}

Menu.prototype.revealInToc = function (path) {
  var current = this.$toc.querySelectorAll('li.revealed');
  for (var i = 0; i < current.length; i++) {
    current[i].classList.remove('revealed');
    current[i].classList.remove('revealed-leaf');
  }
  
  var current = this.$toc;
  var index = 0;
  while (index < path.length) {
    var children = current.children;
    for (var i = 0; i < children.length; i++) {
      if ('#' + path[index].id === children[i].children[1].getAttribute('href') ) {
        children[i].classList.add('revealed');
        if (index === path.length - 1) {
          children[i].classList.add('revealed-leaf');
          var rect = children[i].getBoundingClientRect();
          this.$toc.getBoundingClientRect().top
          var tocRect = this.$toc.getBoundingClientRect();
          if (rect.top + 10 > tocRect.bottom) {
            this.$toc.scrollTop = this.$toc.scrollTop + (rect.top - tocRect.bottom) + (rect.bottom - rect.top);
          } else if (rect.top < tocRect.top) {
            this.$toc.scrollTop = this.$toc.scrollTop - (tocRect.top - rect.top);
          }
        }
        current = children[i].querySelector('ol');
        index++;
        break;
      }      
    }
    
  }
}

function findActiveClause(root, path) {
  var clauses = new ClauseWalker(root);
  var $clause;
  var found = false;
  var path = path || [];
  
  while ($clause = clauses.nextNode()) {
    var rect = $clause.getBoundingClientRect();
    var $header = $clause.children[0];
    var marginTop = parseInt(getComputedStyle($header)["margin-top"]);
    
    if ((rect.top - marginTop) <= 0 && rect.bottom > 0) {
      found = true;
      return findActiveClause($clause, path.concat($clause)) || path;
    }
  }
  
  return path;
}

function ClauseWalker(root) {
  var previous;
  var treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: function (node) {
        if (previous === node.parentNode) {
          return NodeFilter.FILTER_REJECT;
        } else {
          previous = node;
        }
        if (node.nodeName === 'EMU-CLAUSE' || node.nodeName === 'EMU-INTRO' || node.nodeName === 'EMU-ANNEX') {
          return NodeFilter.FILTER_ACCEPT;
        } else {
          return NodeFilter.FILTER_SKIP;
        }
      }
    },
    false
    );
  
  return treeWalker;
}

Menu.prototype.toggle = function () {
  this.$menu.classList.toggle('active');
}

Menu.prototype.show = function () {
  this.$menu.classList.add('active');
}

Menu.prototype.hide = function () {
  this.$menu.classList.remove('active');
}

Menu.prototype.isVisible = function() {
  return this.$menu.classList.contains('active');
}

Menu.prototype.showPins = function () {
  this.$pins.classList.add('active');
}

Menu.prototype.hidePins = function () {
  this.$pins.classList.remove('active');
}

Menu.prototype.addPinEntry = function (id) {
  var entry = this.search.biblio.byId[id];
  if (!entry) {
    // id was deleted after pin (or something) so remove it
    delete this._pinnedIds[id];
    this.persistPinEntries();
    return;
  }

  if (entry.type === 'clause') {
    var prefix;
    if (entry.number) {
      prefix = entry.number + ' ';
    } else {
      prefix = '';
    }
    this.$pinList.innerHTML += '<li><a href="#' + entry.id + '">' + prefix + entry.titleHTML + '</a></li>';
  } else {
    this.$pinList.innerHTML += '<li><a href="#' + entry.id + '">' + entry.key + '</a></li>';
  }

  if (Object.keys(this._pinnedIds).length === 0) {
    this.showPins();
  }
  this._pinnedIds[id] = true;
  this.persistPinEntries();
}

Menu.prototype.removePinEntry = function (id) {
  var item = this.$pinList.querySelector('a[href="#' + id + '"]').parentNode;
  this.$pinList.removeChild(item);
  delete this._pinnedIds[id];
  if (Object.keys(this._pinnedIds).length === 0) {
    this.hidePins();
  }

  this.persistPinEntries();
}

Menu.prototype.persistPinEntries = function () {
  try {
    if (!window.localStorage) return;
  } catch (e) {
    return;
  }

  localStorage.pinEntries = JSON.stringify(Object.keys(this._pinnedIds));
}

Menu.prototype.loadPinEntries = function () {
  try {
    if (!window.localStorage) return;
  } catch (e) {
    return;
  }
  
  var pinsString = window.localStorage.pinEntries;
  if (!pinsString) return;
  var pins = JSON.parse(pinsString);
  for(var i = 0; i < pins.length; i++) {
    this.addPinEntry(pins[i]);
  }
}

Menu.prototype.togglePinEntry = function (id) {
  if (!id) {
    id = this.$activeClause[this.$activeClause.length - 1].id;
  }

  if (this._pinnedIds[id]) {
    this.removePinEntry(id);
  } else {
    this.addPinEntry(id);
  }
}

Menu.prototype.selectPin = function (num) {
  document.location = this.$pinList.children[num].children[0].href;
}

var menu;
function init() {
  menu = new Menu();
  var $container = document.getElementById('spec-container');
  $container.addEventListener('mouseover', debounce(function (e) {
    Toolbox.activateIfMouseOver(e);
  }));
}

document.addEventListener('DOMContentLoaded', init);

function debounce(fn, opts) {
  opts = opts || {};
  var timeout;
  return function(e) {
    if (opts.stopPropagation) {
      e.stopPropagation();
    }
    var args = arguments;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(function() {
      timeout = null;
      fn.apply(this, args);
    }.bind(this), 150);
  }
}

var CLAUSE_NODES = ['EMU-CLAUSE', 'EMU-INTRO', 'EMU-ANNEX'];
function findLocalReferences ($elem) {
  var name = $elem.innerHTML;
  var references = [];

  var parentClause = $elem.parentNode;
  while (parentClause && CLAUSE_NODES.indexOf(parentClause.nodeName) === -1) {
    parentClause = parentClause.parentNode;
  }

  if(!parentClause) return;

  var vars = parentClause.querySelectorAll('var');

  for (var i = 0; i < vars.length; i++) {
    var $var = vars[i];

    if ($var.innerHTML === name) {
      references.push($var);
    }
  }

  return references;
}

function toggleFindLocalReferences($elem) {
  var references = findLocalReferences($elem);
  if ($elem.classList.contains('referenced')) {
    references.forEach(function ($reference) {
      $reference.classList.remove('referenced');
    });
  } else {
    references.forEach(function ($reference) {
      $reference.classList.add('referenced');
    });
  }
}

function installFindLocalReferences () {
  document.addEventListener('click', function (e) {
    if (e.target.nodeName === 'VAR') {
      toggleFindLocalReferences(e.target);
    }
  });
}

document.addEventListener('DOMContentLoaded', installFindLocalReferences);




// The following license applies to the fuzzysearch function
// The MIT License (MIT)
// Copyright © 2015 Nicolas Bevacqua
// Copyright © 2016 Brian Terlson
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
function fuzzysearch (searchString, haystack, caseInsensitive) {
  var tlen = haystack.length;
  var qlen = searchString.length;
  var chunks = 1;
  var finding = false;
  var prefix = true;
  
  if (qlen > tlen) {
    return false;
  }
  
  if (qlen === tlen) {
    if (searchString === haystack) {
      return { caseMatch: true, chunks: 1, prefix: true };
    } else if (searchString.toLowerCase() === haystack.toLowerCase()) {
      return { caseMatch: false, chunks: 1, prefix: true };
    } else {
      return false;
    }
  }
  
  outer: for (var i = 0, j = 0; i < qlen; i++) {
    var nch = searchString[i];
    while (j < tlen) {
      var targetChar = haystack[j++];
      if (targetChar === nch) {
        finding = true;
        continue outer;
      }
      if (finding) {
        chunks++;
        finding = false;
      }
    }
    
    if (caseInsensitive) { return false }
    
    return fuzzysearch(searchString.toLowerCase(), haystack.toLowerCase(), true);
  }
  
  return { caseMatch: !caseInsensitive, chunks: chunks, prefix: j <= qlen };
}

var Toolbox = {
  init: function () {
    this.$container = document.createElement('div');
    this.$container.classList.add('toolbox');
    this.$permalink = document.createElement('a');
    this.$permalink.textContent = 'Permalink';
    this.$pinLink = document.createElement('a');
    this.$pinLink.textContent = 'Pin';
    this.$pinLink.setAttribute('href', '#');
    this.$pinLink.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      menu.togglePinEntry(this.entry.id);
    }.bind(this));

    this.$refsLink = document.createElement('a');
    this.$refsLink.setAttribute('href', '#');
    this.$refsLink.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      referencePane.showReferencesFor(this.entry);
    }.bind(this));
    this.$container.appendChild(this.$permalink);
    this.$container.appendChild(this.$pinLink);
    this.$container.appendChild(this.$refsLink);
    document.body.appendChild(this.$container);
  },

  activate: function (el, entry, target) {
    if (el === this._activeEl) return;
    this.active = true;
    this.entry = entry;
    this.$container.classList.add('active');
    this.top = el.offsetTop - this.$container.offsetHeight - 10;
    this.left = el.offsetLeft;
    this.$container.setAttribute('style', 'left: ' + this.left + 'px; top: ' + this.top + 'px');
    this.updatePermalink();
    this.updateReferences();
    this._activeEl = el;
    if (this.top < document.body.scrollTop && el === target) {
      // don't scroll unless it's a small thing (< 200px)
      this.$container.scrollIntoView();
    }
  },

  updatePermalink: function () {
    this.$permalink.setAttribute('href', '#' + this.entry.id);
  },

  updateReferences: function () {
    this.$refsLink.textContent = 'References (' + this.entry.referencingIds.length + ')';
  },

  activateIfMouseOver: function (e) {
    var ref = this.findReferenceUnder(e.target);
    if (ref && (!this.active || e.pageY > this._activeEl.offsetTop)) {
      var entry = menu.search.biblio.byId[ref.id];
      this.activate(ref.element, entry, e.target);
    } else if (this.active && ((e.pageY < this.top) || e.pageY > (this._activeEl.offsetTop + this._activeEl.offsetHeight))) {
      this.deactivate();
    }
  },

  findReferenceUnder: function (el) {
    while (el) {
      var parent = el.parentNode;
      if (el.nodeName === 'H1' && parent.nodeName.match(/EMU-CLAUSE|EMU-ANNEX|EMU-INTRO/) && parent.id) {
        return { element: el, id: parent.id };
      } else if (el.nodeName.match(/EMU-(?!CLAUSE|XREF|ANNEX|INTRO)|DFN/) &&
                el.id && el.id[0] !== '_') {
        if (el.nodeName === 'EMU-FIGURE' || el.nodeName === 'EMU-TABLE' || el.nodeName === 'EMU-EXAMPLE') {
          // return the figcaption element
          return { element: el.children[0].children[0], id: el.id };
        } else if (el.nodeName === 'EMU-PRODUCTION') {
          // return the LHS non-terminal element
          return { element: el.children[0], id: el.id };
        } else {
          return { element: el, id: el.id };
        }
      }
      el = parent;
    }
  },

  deactivate: function () {
    this.$container.classList.remove('active');
    this._activeEl = null;
    this.activeElBounds = null;
    this.active = false;
  }
}

var referencePane = {
  init: function() {
    this.$container = document.createElement('div');
    this.$container.setAttribute('id', 'references-pane-container');

    var $spacer = document.createElement('div');
    $spacer.setAttribute('id', 'references-pane-spacer');

    this.$pane = document.createElement('div');
    this.$pane.setAttribute('id', 'references-pane');

    this.$container.appendChild($spacer);
    this.$container.appendChild(this.$pane);

    this.$header = document.createElement('div');
    this.$header.classList.add('menu-pane-header');
    this.$header.textContent = 'References to ';
    this.$headerRefId = document.createElement('a');
    this.$header.appendChild(this.$headerRefId);
    this.$closeButton = document.createElement('span');
    this.$closeButton.setAttribute('id', 'references-pane-close');
    this.$closeButton.addEventListener('click', function (e) {
      this.deactivate();
    }.bind(this));
    this.$header.appendChild(this.$closeButton);

    this.$pane.appendChild(this.$header);
    var tableContainer = document.createElement('div');
    tableContainer.setAttribute('id', 'references-pane-table-container');

    this.$table = document.createElement('table');
    this.$table.setAttribute('id', 'references-pane-table');

    this.$tableBody = this.$table.createTBody();

    tableContainer.appendChild(this.$table);
    this.$pane.appendChild(tableContainer);

    menu.$specContainer.appendChild(this.$container);
  },

  activate: function () {
    this.$container.classList.add('active');
  },

  deactivate: function () {
    this.$container.classList.remove('active');
  },

  showReferencesFor(entry) {
    this.activate();
    var newBody = document.createElement('tbody');
    var previousId;
    var previousCell;
    var dupCount = 0;
    this.$headerRefId.textContent = '#' + entry.id;
    this.$headerRefId.setAttribute('href', '#' + entry.id);
    entry.referencingIds.map(function (id) {
      var target = document.getElementById(id);
      var cid = findParentClauseId(target);
      var clause = menu.search.biblio.byId[cid];
      var dupCount = 0;
      return { id: id, clause: clause }
    }).sort(function (a, b) {
      return sortByClauseNumber(a.clause, b.clause);
    }).forEach(function (record, i) {
      if (previousId === record.clause.id) {
        previousCell.innerHTML += ' (<a href="#' + record.id + '">' + (dupCount + 2) + '</a>)';
        dupCount++;
      } else {
        var row = newBody.insertRow();
        var cell = row.insertCell();
        cell.innerHTML = record.clause.number;
        cell = row.insertCell();
        cell.innerHTML = '<a href="#' + record.id + '">' + record.clause.titleHTML + '</a>';
        previousCell = cell;
        previousId = record.clause.id;
        dupCount = 0;
      }
    }, this);
    this.$table.removeChild(this.$tableBody);
    this.$tableBody = newBody;
    this.$table.appendChild(this.$tableBody);
  }
}
function findParentClauseId(node) {
  while (node && node.nodeName !== 'EMU-CLAUSE' && node.nodeName !== 'EMU-INTRO' && node.nodeName !== 'EMU-ANNEX') {
    node = node.parentNode;
  }
  if (!node) return null;
  return node.getAttribute('id');
}

function sortByClauseNumber(c1, c2) {
  var c1c = c1.number.split('.');
  var c2c = c2.number.split('.');

  for (var i = 0; i < c1c.length; i++) {
    if (i >= c2c.length) {
      return 1;
    }
    
    var c1 = c1c[i];
    var c2 = c2c[i];
    var c1cn = Number(c1);
    var c2cn = Number(c2);

    if (Number.isNaN(c1cn) && Number.isNaN(c2cn)) {
      if (c1 > c2) {
        return 1;
      } else if (c1 < c2) {
        return -1;
      }
    } else if (!Number.isNaN(c1cn) && Number.isNaN(c2cn)) {
      return -1;
    } else if (Number.isNaN(c1cn) && !Number.isNaN(c2cn)) {
      return 1;
    } else if(c1cn > c2cn) {
      return 1;
    } else if (c1cn < c2cn) {
      return -1;
    }
  }

  if (c1c.length === c2c.length) {
    return 0;
  }
  return -1;
}

document.addEventListener('DOMContentLoaded', function () {
  Toolbox.init();
  referencePane.init();
})
var CLAUSE_NODES = ['EMU-CLAUSE', 'EMU-INTRO', 'EMU-ANNEX'];
function findLocalReferences ($elem) {
  var name = $elem.innerHTML;
  var references = [];

  var parentClause = $elem.parentNode;
  while (parentClause && CLAUSE_NODES.indexOf(parentClause.nodeName) === -1) {
    parentClause = parentClause.parentNode;
  }

  if(!parentClause) return;

  var vars = parentClause.querySelectorAll('var');

  for (var i = 0; i < vars.length; i++) {
    var $var = vars[i];

    if ($var.innerHTML === name) {
      references.push($var);
    }
  }

  return references;
}

function toggleFindLocalReferences($elem) {
  var references = findLocalReferences($elem);
  if ($elem.classList.contains('referenced')) {
    references.forEach(function ($reference) {
      $reference.classList.remove('referenced');
    });
  } else {
    references.forEach(function ($reference) {
      $reference.classList.add('referenced');
    });
  }
}

function installFindLocalReferences () {
  document.addEventListener('click', function (e) {
    if (e.target.nodeName === 'VAR') {
      toggleFindLocalReferences(e.target);
    }
  });
}

document.addEventListener('DOMContentLoaded', installFindLocalReferences);

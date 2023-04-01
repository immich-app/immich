const prefix = 'algolia-docsearch';
const suggestionPrefix = `${prefix}-suggestion`;
const footerPrefix = `${prefix}-footer`;

const templates = {
  suggestion: `
  <a class="${suggestionPrefix}
    {{#isCategoryHeader}}${suggestionPrefix}__main{{/isCategoryHeader}}
    {{#isSubCategoryHeader}}${suggestionPrefix}__secondary{{/isSubCategoryHeader}}
    "
    aria-label="Link to the result"
    href="{{{url}}}"
    >
    <div class="${suggestionPrefix}--category-header">
        <span class="${suggestionPrefix}--category-header-lvl0">{{{category}}}</span>
    </div>
    <div class="${suggestionPrefix}--wrapper">
      <div class="${suggestionPrefix}--subcategory-column">
        <span class="${suggestionPrefix}--subcategory-column-text">{{{subcategory}}}</span>
      </div>
      {{#isTextOrSubcategoryNonEmpty}}
      <div class="${suggestionPrefix}--content">
        <div class="${suggestionPrefix}--subcategory-inline">{{{subcategory}}}</div>
        <div class="${suggestionPrefix}--title">{{{title}}}</div>
        {{#text}}<div class="${suggestionPrefix}--text">{{{text}}}</div>{{/text}}
      </div>
      {{/isTextOrSubcategoryNonEmpty}}
    </div>
  </a>
  `,
  suggestionSimple: `
  <div class="${suggestionPrefix}
    {{#isCategoryHeader}}${suggestionPrefix}__main{{/isCategoryHeader}}
    {{#isSubCategoryHeader}}${suggestionPrefix}__secondary{{/isSubCategoryHeader}}
    suggestion-layout-simple
  ">
    <div class="${suggestionPrefix}--category-header">
        {{^isLvl0}}
        <span class="${suggestionPrefix}--category-header-lvl0 ${suggestionPrefix}--category-header-item">{{{category}}}</span>
          {{^isLvl1}}
          {{^isLvl1EmptyOrDuplicate}}
          <span class="${suggestionPrefix}--category-header-lvl1 ${suggestionPrefix}--category-header-item">
              {{{subcategory}}}
          </span>
          {{/isLvl1EmptyOrDuplicate}}
          {{/isLvl1}}
        {{/isLvl0}}
        <div class="${suggestionPrefix}--title ${suggestionPrefix}--category-header-item">
            {{#isLvl2}}
                {{{title}}}
            {{/isLvl2}}
            {{#isLvl1}}
                {{{subcategory}}}
            {{/isLvl1}}
            {{#isLvl0}}
                {{{category}}}
            {{/isLvl0}}
        </div>
    </div>
    <div class="${suggestionPrefix}--wrapper">
      {{#text}}
      <div class="${suggestionPrefix}--content">
        <div class="${suggestionPrefix}--text">{{{text}}}</div>
      </div>
      {{/text}}
    </div>
  </div>
  `,
  footer: `
    <div class="${footerPrefix}">
    </div>
  `,
  empty: `
  <div class="${suggestionPrefix}">
    <div class="${suggestionPrefix}--wrapper">
        <div class="${suggestionPrefix}--content ${suggestionPrefix}--no-results">
            <div class="${suggestionPrefix}--title">
                <div class="${suggestionPrefix}--text">
                    No results found for query <b>"{{query}}"</b>
                </div>
            </div>
        </div>
    </div>
  </div>
  `,
  searchBox: `
  <form novalidate="novalidate" onsubmit="return false;" class="searchbox">
    <div role="search" class="searchbox__wrapper">
      <input id="docsearch" type="search" name="search" placeholder="Search the docs" autocomplete="off" required="required" class="searchbox__input"/>
      <button type="submit" title="Submit your search query." class="searchbox__submit" >
        <svg width=12 height=12 role="img" aria-label="Search">
          <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#sbx-icon-search-13"></use>
        </svg>
      </button>
      <button type="reset" title="Clear the search query." class="searchbox__reset hide">
        <svg width=12 height=12 role="img" aria-label="Reset">
          <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#sbx-icon-clear-3"></use>
        </svg>
      </button>
    </div>
</form>

<div class="svg-icons" style="height: 0; width: 0; position: absolute; visibility: hidden">
  <svg xmlns="http://www.w3.org/2000/svg">
    <symbol id="sbx-icon-clear-3" viewBox="0 0 40 40"><path d="M16.228 20L1.886 5.657 0 3.772 3.772 0l1.885 1.886L20 16.228 34.343 1.886 36.228 0 40 3.772l-1.886 1.885L23.772 20l14.342 14.343L40 36.228 36.228 40l-1.885-1.886L20 23.772 5.657 38.114 3.772 40 0 36.228l1.886-1.885L16.228 20z" fill-rule="evenodd"></symbol>
    <symbol id="sbx-icon-search-13" viewBox="0 0 40 40"><path d="M26.806 29.012a16.312 16.312 0 0 1-10.427 3.746C7.332 32.758 0 25.425 0 16.378 0 7.334 7.333 0 16.38 0c9.045 0 16.378 7.333 16.378 16.38 0 3.96-1.406 7.593-3.746 10.426L39.547 37.34c.607.608.61 1.59-.004 2.203a1.56 1.56 0 0 1-2.202.004L26.807 29.012zm-10.427.627c7.322 0 13.26-5.938 13.26-13.26 0-7.324-5.938-13.26-13.26-13.26-7.324 0-13.26 5.936-13.26 13.26 0 7.322 5.936 13.26 13.26 13.26z" fill-rule="evenodd"></symbol>
  </svg>
</div>
  `,
};

export default templates;

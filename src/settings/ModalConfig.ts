export const MODAL_CONFIG = {
    PAGINATION: {
        ITEMS_PER_PAGE: 10,
        MAX_PAGE_BUTTONS: 5
    },
    CLASSES: {
        MODAL: "file-picker-modal",
        FORM_SECTION: "link-form-section",
        SECTION_TITLE: "section-title",
        INPUT_CONTAINER: "file-picker-input",
        INPUT_FIELD: "file-picker-input-field",
        BUTTON_CONTAINER: "button-container",
        SEARCH_SECTION: "search-section",
        SEARCH_CONTAINER: "search-container",
        SEARCH_INPUT: "search-input",
        LINKS_CONTAINER: "links-container",
        PAGINATION_CONTAINER: "pagination-container",
        PAGE_MODE_TOGGLE: "page-mode-toggle-container",
        PAGE_MODE_WRAPPER: "page-mode-toggle-wrapper",
        PAGE_MODE_LABEL: "page-mode-toggle-label",
        PAGE_MODE_INPUT_WRAPPER: "page-mode-toggle-input-wrapper",
        PAGE_MODE_INPUT: "page-mode-toggle-input",
        PAGE_MODE_DESCRIPTION: "page-mode-description",
        PAGE_MODE_DESCRIPTION_TEXT: "page-mode-description-text",
        PAGE_MODE_ICON: "page-mode-icon",
        LINK_MODE: "link-mode",
        MODE_ICON: "mode-icon",
        MODE_TEXT: "mode-text"
    },
    TEXTS: {
        CREATE_NEW_LINK: "Create New Link",
        EXISTING_LINKS: "Existing Links",
        PDF_PLACEHOLDER: "PDF File Path",
        MD_PLACEHOLDER: "Markdown File Path",
        SEARCH_PLACEHOLDER: "Search links by PDF or Note path...",
        CREATE_LINK: "Create Link",
        CLEAR: "Clear",
        DELETE: "Delete",
        PREVIOUS: "Previous",
        NEXT: "Next",
        PAGE_MODE: "Page Mode",
        PAGE_MODE_DESCRIPTION: "Enable to create separate notes for each PDF page. Disable for a single note per PDF."
    }
} as const;

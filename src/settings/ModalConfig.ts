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
        PAGINATION_CONTAINER: "pagination-container"
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
        NEXT: "Next"
    }
} as const;

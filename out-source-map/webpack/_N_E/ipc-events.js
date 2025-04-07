module.exports = {
  UPDATE__STATE: 'update:state',
  UPDATE__QUIT_AND_INSTALL: 'update:quit-and-install',
  UPDATE__DOWNLOAD: 'update:download',

  UPDATE__UPDATE_AVAILABLE: 'update:update-available',
  UPDATE__ERROR: 'update:error',
  UPDATE__DOWNLOAD_PROGRESS: 'update:download-progress',
  UPDATE__UPDATE_DOWNLOADED: 'update:update-downloaded',
  UPDATE__CHECK_FOR_UPDATE_REQUESTED: 'update:check-for-update-requested',

  APP__EXPORT_TO_PDF: 'app:export-to-pdf',
  APP__EXPORT_RICH_TEXT: 'app:export-rich-text',
  APP__EXPORT_TO_FILE: 'app:export-to-file',
  APP__OPEN_SAVED_DIFF: 'app:open-saved-diff',
  APP__LOGOUT_REQUESTED: 'app:logout-requested',
  APP__OPEN_EXTERNAL_REQUESTED: 'app:open-external-requested',
  APP__DIR_OPENED: 'app:dir-opened',
  APP__DIR_COMPARE_REQUEST: 'app:dir-compare-request',
  APP__DIR_COMPARED: 'app:dir-compared',
  APP__FETCH_LOCAL_FILE: 'app:fetch-local-file',
  APP__FETCH_LOCAL_DIR: 'app:fetch-local-dir',
  // Invoked to perform the actual find operation.
  APP__FIND_IN_PAGE: 'app:find-in-page',
  // Invoked/emitted when the global find-in-page bar is activated.
  APP__FIND_IN_PAGE_ACTIVE: 'app:find-in-page-active',
  APP__LOGIN_WITH_LICENSE_DATA: 'app:login-with-license-data',
  APP__GET_PATH: 'app:get-path',
  APP__GET_CPU_INFO: 'app:get-cpu-info',
  APP__CONVERT_PDF: 'app:convert-pdf',
  APP__TOGGLE_FULLSCREEN: 'app:toggle-fullscreen',
  APP__TOGGLE_MAXIMIZE: 'app:toggle-maximize',
  APP__TOGGLE_MINIMIZE: 'app:toggle-minimize',
  APP__TOGGLE_CLOSE: 'app:toggle-close',
  APP__WORD_CONVERSION: 'app:word-conversion',
  APP__HAS_WORD_MAC: 'app:has-word-mac',
  APP__HAS_PAGES: 'app:has-pages',
  APP__MAC_WORD_CONVERSION: 'app:mac-word-conversion',
  APP__MAC_PAGES_CONVERSION: 'app:mac-pages-conversion',
  APP__MAC_WORD_REDLINE: 'app:mac-word-redline',
  APP__WORD_REDLINE: 'app:word-redline',
  APP__REDLINE_DIFF_TYPE_SELECTED: 'app:redline-diff-type-selected',
  APP__PDF_INPUT_VISIBILITY_CHANGED: 'app:pdf-input-visibility-changed',
  APP__REDLINE_SIDEBAR_VISIBILITY_CHANGED:
    'app:redline-sidebar-visibility-changed',
  APP__REDLINE_BANNER_VISIBILITY_CHANGED:
    'app:redline-banner-visibility-changed',
  APP__REDLINE_ERROR_BANNER_VISIBILITY_CHANGED:
    'app:redline-error-banner-visibility-changed',
  APP__REDLINE_CLOSE_WORD_PROCESS: 'app:redline-close-word-process',
  APP__REDLINE_ENABLE_SEARCH: 'app:redline-enable-search',
  APP__REDLINE_CHANGE_VIEW_TYPE: 'app:redline-change-view-type',
  APP__REDLINE_CHANGE_PAGE: 'app:redline-change-page',
  APP__REDLINE_OPEN_ZOOM_MENU: 'app:redline-open-zoom-menu',
  APP__REDLINE_ZOOM_CHANGE_RESPONSE: 'app:redline-zoom-change-response',
  APP__REDLINE_SCROLL_TO_REVISION: 'app:redline-scroll-to-revision',
  APP__REDLINE_EXPORT_WITH_ACCEPTED_REVISIONS:
    'app:redline-export-with-accepted-revisions',
  APP__REDLINE_EXPORT_ACCEPTED_REVISIONS_COMPLETED:
    'app:redline-export-accepted-revisions-completed',
  APP__REDLINE_REVISIONS_READY: 'app:redline-revisions-ready',
  APP__REDLINE_RENDERING_ERROR: 'app:redline-rendering-error',
  APP__HAS_WORD: 'app:has-word',
  APP__HAS_MICROSOFT_PRINT_TO_PDF: 'app:has-microsoft-print-to-pdf',
  APP__GIT_DIFF_START: 'app:git-diff-start',
  APP__GIT_DIFF_END: 'app:git-diff-end',
  APP__GIT_DIFF_FILE: 'app:git-diff-file',
  APP__GIT_DIFF_FILE_DATA_REQUEST: 'app:git-diff-file-data-request',
  APP__FOLDER_DIFF_FILE_DATA_REQUEST: 'app:folder-diff-file-data-request',
  APP__CHECK_PASSWORD_PROTECTED: 'app:check-password-protected',
  APP__UNLOCK_PASSWORD_PROTECTED: 'app:unlock-password-protected',
  APP__SAVE_FILE: 'app:save-file',
  APP__DELETE_FILES: 'app:delete-files',

  // Menu button has been clicked in the tab bar
  // Takes as payload `{x: number; y: number;}`
  APP__TAB_MENU: 'app:tab-menu',
  // Tab has been requested to be opened (`webContents` -> `node`)
  // Takes as payload `{id?: string; url: string; activate?: boolean}`
  APP__TAB_OPEN: 'app:tab-open',
  // Tab has been requested to be activated (`webContents` -> `node`)
  // Takes as payload `{id: string;}`
  APP__TAB_ACTIVATE: 'app:tab-activate',
  // Tab has been requested to be closed (`webContents` -> `node`)
  // Takes as payload `{id: string;}`
  APP__TAB_CLOSE: 'app:tab-close',
  // Tab has been requested to be moved (`webContents` -> `node`)
  // Takes as payload `{id: string; before: string}`
  APP__TAB_MOVE: 'app:tab-move',
  // Tab state has changed, request to synchronize UI (`node` -> `webContents`)
  // Takes as payload `{id: string; active: boolean;}[]`
  APP__TAB_CHANGE: 'app:tab-change',
};

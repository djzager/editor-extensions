export interface Range {
  start: { line: number; character: number };
  end: { line: number; character: number };
}

export interface RangeInFile {
  filepath: string;
  range: Range;
}

export interface ContextItem {
  name: string;
  description: string;
  content: string;
  range?: RangeInFile;
}

export interface ContextItemWithId extends ContextItem {
  id: string;
}

export interface ContextProviderDescription {
  title: string;
  displayTitle: string;
  description: string;
  type: "normal" | "submenu";
}

export interface ContextProviderExtras {
  selectedCode?: RangeInFile[];
  clipboard?: string;
  fullCodebase?: string;
  currentFile?: string;
  currentFileContent?: string;
  currentFileLanguage?: string;
  currentFileRange?: Range;
  currentFileRangeInFile?: RangeInFile;
  currentFileRangeInFileWithContents?: RangeInFile & { contents: string };
  currentFileRangeInFileWithContentsAndContext?: RangeInFile & {
    contents: string;
    context: string;
  };
  currentFileRangeInFileWithContentsAndContextAndRelated?: RangeInFile & {
    contents: string;
    context: string;
    related: string[];
  };
  currentFileRangeInFileWithContentsAndContextAndRelatedAndSubmenu?: RangeInFile & {
    contents: string;
    context: string;
    related: string[];
    submenu: string[];
  };
  currentFileRangeInFileWithContentsAndContextAndRelatedAndSubmenuAndSelection?: RangeInFile & {
    contents: string;
    context: string;
    related: string[];
    submenu: string[];
    selection: string;
  };
  currentFileRangeInFileWithContentsAndContextAndRelatedAndSubmenuAndSelectionAndClipboard?: RangeInFile & {
    contents: string;
    context: string;
    related: string[];
    submenu: string[];
    selection: string;
    clipboard: string;
  };
  currentFileRangeInFileWithContentsAndContextAndRelatedAndSubmenuAndSelectionAndClipboardAndFullCodebase?: RangeInFile & {
    contents: string;
    context: string;
    related: string[];
    submenu: string[];
    selection: string;
    clipboard: string;
    fullCodebase: string;
  };
  currentFileRangeInFileWithContentsAndContextAndRelatedAndSubmenuAndSelectionAndClipboardAndFullCodebaseAndCurrentFile?: RangeInFile & {
    contents: string;
    context: string;
    related: string[];
    submenu: string[];
    selection: string;
    clipboard: string;
    fullCodebase: string;
    currentFile: string;
  };
  currentFileRangeInFileWithContentsAndContextAndRelatedAndSubmenuAndSelectionAndClipboardAndFullCodebaseAndCurrentFileAndCurrentFileContent?: RangeInFile & {
    contents: string;
    context: string;
    related: string[];
    submenu: string[];
    selection: string;
    clipboard: string;
    fullCodebase: string;
    currentFile: string;
    currentFileContent: string;
  };
  currentFileRangeInFileWithContentsAndContextAndRelatedAndSubmenuAndSelectionAndClipboardAndFullCodebaseAndCurrentFileAndCurrentFileContentAndCurrentFileLanguage?: RangeInFile & {
    contents: string;
    context: string;
    related: string[];
    submenu: string[];
    selection: string;
    clipboard: string;
    fullCodebase: string;
    currentFile: string;
    currentFileContent: string;
    currentFileLanguage: string;
  };
  currentFileRangeInFileWithContentsAndContextAndRelatedAndSubmenuAndSelectionAndClipboardAndFullCodebaseAndCurrentFileAndCurrentFileContentAndCurrentFileLanguageAndCurrentFileRange?: RangeInFile & {
    contents: string;
    context: string;
    related: string[];
    submenu: string[];
    selection: string;
    clipboard: string;
    fullCodebase: string;
    currentFile: string;
    currentFileContent: string;
    currentFileLanguage: string;
    currentFileRange: Range;
  };
  currentFileRangeInFileWithContentsAndContextAndRelatedAndSubmenuAndSelectionAndClipboardAndFullCodebaseAndCurrentFileAndCurrentFileContentAndCurrentFileLanguageAndCurrentFileRangeAndCurrentFileRangeInFile?: RangeInFile & {
    contents: string;
    context: string;
    related: string[];
    submenu: string[];
    selection: string;
    clipboard: string;
    fullCodebase: string;
    currentFile: string;
    currentFileContent: string;
    currentFileLanguage: string;
    currentFileRange: Range;
    currentFileRangeInFile: RangeInFile;
  };
  currentFileRangeInFileWithContentsAndContextAndRelatedAndSubmenuAndSelectionAndClipboardAndFullCodebaseAndCurrentFileAndCurrentFileContentAndCurrentFileLanguageAndCurrentFileRangeAndCurrentFileRangeInFileAndSelectedCode?: RangeInFile & {
    contents: string;
    context: string;
    related: string[];
    submenu: string[];
    selection: string;
    clipboard: string;
    fullCodebase: string;
    currentFile: string;
    currentFileContent: string;
    currentFileLanguage: string;
    currentFileRange: Range;
    currentFileRangeInFile: RangeInFile;
    selectedCode: RangeInFile[];
  };
}

export interface LoadSubmenuItemsArgs {
  item: ContextItem;
  query: string;
  extras: ContextProviderExtras;
}

export interface ContextSubmenuItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  metadata?: any;
}

export interface IContextProvider {
  get description(): ContextProviderDescription;
  getContextItems(query: string, extras: ContextProviderExtras): Promise<ContextItem[]>;
  loadSubmenuItems?(args: LoadSubmenuItemsArgs): Promise<ContextSubmenuItem[]>;
}

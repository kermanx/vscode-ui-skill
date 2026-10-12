export const settingsGroups = [
 {id:'editor',label:'Text Editor',settings:[
  {key:'editor.wordWrap',type:'enum',defaultValue:'off',description:'Controls how lines should wrap.',options:[{value:'off',description:'Lines will never wrap.'},{value:'on',description:'Lines will wrap at the viewport width.'},{value:'wordWrapColumn',description:'Lines will wrap at the configured column.'}]},
  {key:'editor.fontSize',type:'integer',defaultValue:14,description:'Controls the font size in pixels.',validator:(value:string)=>Number(value)<6||Number(value)>100?'Value must be between 6 and 100.':''},
  {key:'editor.fontFamily',type:'string',defaultValue:'Menlo, Monaco, monospace',description:'Controls the font family.'},
  {key:'editor.lineHeight',type:'number',defaultValue:0,description:'Controls the line height. Use 0 to compute it from the font size.'},
  {key:'editor.renderWhitespace',type:'boolean',defaultValue:false,description:'Render whitespace characters in the editor.'},
 ]},
 {id:'files',label:'Files',settings:[
  {key:'files.trimTrailingWhitespace',type:'boolean',defaultValue:false,description:'Trim trailing whitespace when saving a file.'},
  {key:'files.excludeRules',type:'complex',defaultValue:[{pattern:'**/.git',enabled:true}],description:'Configure advanced file exclusion rules.'},
  {key:'files.header',type:'multiline',defaultValue:'Copyright notice\nAll rights reserved.',description:'Text inserted at the beginning of new files.'},
  {key:'files.legacyEncoding',type:'string',defaultValue:'utf8',description:'Fallback text encoding for legacy files.',deprecationMessage:'Use Files: Encoding instead.'},
 ]},
];
export const initialSettingsValues = {user:{'editor.fontSize':16} as Record<string,unknown>,workspace:{} as Record<string,unknown>};

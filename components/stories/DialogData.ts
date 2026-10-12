import type { DialogButton, DialogInput } from '../src/components/dialog/types';
import type { DropdownAction } from '../src/components/button/dropdownTypes';
export interface DialogExample {
  name:string; message:string; detail?:string; type?:'none'|'info'|'error'|'warning'|'question'|'pending';
  buttons?:readonly(string|DialogButton)[];cancelId?:number;alignment?:'horizontal'|'vertical';
  checkboxLabel?:string;checkboxChecked?:boolean;inputs?:readonly DialogInput[];primaryActions?:readonly DropdownAction[];
  disableCloseAction?:boolean;disableCloseButton?:boolean;disableDefaultAction?:boolean;
  richDetail?:boolean;customBody?:boolean;footer?:boolean;
}
export const dialogExamples:DialogExample[]=[
  {name:'Information',message:'Save your changes?',detail:'Your changes to editor.ts will be saved to this workspace.',buttons:['&&Save','Cancel'],cancelId:1,type:'info'},
  {name:'Destructive confirmation',message:'Delete the selected files?',detail:'This will permanently delete the files. This action cannot be undone.',buttons:['Delete','Cancel'],cancelId:1,type:'warning',checkboxLabel:'Do not ask me again'},
  {name:'Error',message:'Unable to open this file.',type:'error'},
  {name:'Three buttons',message:'Do you want to save your changes?',detail:'The file has changes that have not been saved.',buttons:['Save',"Don’t Save",'Cancel'],cancelId:2,type:'question'},
  {name:'Inputs and checkbox',message:'Sign in to your workspace',detail:'Enter your user name and password.',buttons:['Sign In','Cancel'],cancelId:1,inputs:[{placeholder:'User name',value:'alice'},{placeholder:'Password',type:'password',value:'secret'}],checkboxLabel:'Remember this account',checkboxChecked:true,type:'info'},
  {name:'Vertical choices',message:'How would you like to open the project?',detail:'Choose where you want to work.',buttons:[{label:'Open Locally',sublabel:'Work with files on this computer'},{label:'Open Remotely',sublabel:'Connect to a development server'},'Cancel'],cancelId:2,alignment:'vertical',type:'question'},
  {name:'Rich detail and footer',message:'Workspace trust',detail:'Plain detail is replaced by the rendered content.',richDetail:true,footer:true,buttons:['Trust Workspace','Cancel'],cancelId:1,type:'warning'},
  {name:'Custom body without icon',message:'Review the configuration',customBody:true,footer:true,buttons:['Continue','Cancel'],cancelId:1,type:'none'},
  {name:'Pending without close',message:'Connecting to the server',detail:'Please wait while the connection is established.',type:'pending',disableDefaultAction:true,disableCloseAction:true,footer:true},
  {name:'Hidden close button',message:'This dialog has no close button.',detail:'Escape still cancels this dialog.',buttons:['Continue','Cancel'],cancelId:1,disableCloseButton:true,type:'info'},
  {name:'Primary dropdown',message:'A file with this name already exists.',detail:'Choose how to save the file.',buttons:['Save','Cancel'],cancelId:1,type:'warning',primaryActions:[{id:'replace',label:'Replace File'},{id:'keep-both',label:'Keep Both'}]},
  {name:'Cancel at original index zero',message:'Continue with this value?',buttons:['Cancel','Continue'],cancelId:0,inputs:[{placeholder:'Value',value:'example'}],type:'question'},
  {name:'Long detail',message:'Diagnostic details',detail:Array.from({length:36},(_,i)=>`Line ${i+1}: The workspace reported an additional diagnostic message.`).join('\n'),buttons:['OK'],type:'error'},
];
export function dialogProps(example:DialogExample){const{name,richDetail,customBody,footer,...props}=example;return props;}

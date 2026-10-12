import type {Meta,StoryObj} from '@storybook/vue3-vite';
import Dialog from '../src/components/dialog/Dialog.vue';
import DialogSpecimen from './DialogSpecimen.vue';
import Compare from './Compare.vue';
const meta={title:'Components/Dialog',component:Dialog,args:{open:true,message:'Save your changes?',detail:'Your changes will be saved to this workspace.',type:'info',buttons:['Save','Cancel'],cancelId:1,alignment:'horizontal',disableCloseAction:false,disableCloseButton:false,disableDefaultAction:false},argTypes:{type:{control:'select',options:['none','info','error','question','warning','pending']},alignment:{control:'select',options:['horizontal','vertical']}}} satisfies Meta<typeof Dialog>;
export default meta;type Story=StoryObj<typeof meta>;
export const Review:Story={parameters:{controls:{disable:true}},render:(_,context)=>({components:{Compare},setup:()=>({globals:context.globals}),template:'<Compare kind="dialog" :theme="globals.theme" />'})};
export const Playground:Story={tags:['autodocs'],render:args=>({components:{Dialog},setup:()=>({args}),template:'<div class="playground"><button class="outside" @click="args.open=true">Open dialog</button><Dialog v-bind="args" @update:open="args.open=$event" /></div>'}),parameters:{docs:{description:{story:'完整modal对话框：平台按钮排序仍返回原始索引，输入、复选框、纵向选项、主按钮下拉和富内容slot。Tab/Shift+Tab在链接、输入、复选框、按钮和footer之间循环；输入内Enter选择首个非取消动作，Escape在keyup取消。关闭按钮和Escape关闭不返回输入values，按钮动作返回values。关闭后恢复先前焦点；detail/default/footer slots中的链接加入焦点顺序。尺寸、图标颜色及遮罩沿用组件默认样式。'}}}};
export const Specimen:Story={parameters:{controls:{disable:true}},render:(_,context)=>({components:{DialogSpecimen},setup:()=>({globals:context.globals}),template:'<DialogSpecimen :theme="globals.theme" />'})};

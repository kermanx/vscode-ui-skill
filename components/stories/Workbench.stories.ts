import type {Meta,StoryObj} from '@storybook/vue3-vite';
import WorkbenchSpecimen from './WorkbenchSpecimen.vue';
import Compare from './Compare.vue';
import WorkbenchDemo from './WorkbenchDemo.vue';
const meta={title:'Compositions/Workbench',component:WorkbenchSpecimen,args:{theme:'dark'},parameters:{controls:{disable:true}}} satisfies Meta<typeof WorkbenchSpecimen>;export default meta;type Story=StoryObj<typeof meta>;
export const Review:Story={render:(_,context)=>({components:{Compare},setup:()=>({globals:context.globals}),template:'<Compare kind="workbench" :theme="globals.theme" />'})};
export const Specimen:Story={render:(_,context)=>({components:{WorkbenchSpecimen},setup:()=>({globals:context.globals}),template:'<WorkbenchSpecimen :theme="globals.theme" />'})};
export const Demo:Story={name:'完整工作台 Demo',render:(_,context)=>({components:{WorkbenchDemo},setup:()=>({globals:context.globals}),template:'<WorkbenchDemo :theme="globals.theme" />'})};

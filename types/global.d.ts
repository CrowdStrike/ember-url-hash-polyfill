// Types for compiled templates
declare module 'ember-url-hash-polyfill/templates/*' {
  import { TemplateFactory } from 'htmlbars-inline-precompile';
  const tmpl: TemplateFactory;
  export default tmpl;
}

type RouterArgs = object[];

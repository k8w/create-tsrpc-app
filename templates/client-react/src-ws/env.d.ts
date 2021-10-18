/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PUBLIC_URL: string;
  }
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// TSRPC would decode ObjectId as string in frontend.
declare module 'mongodb' {
  export type ObjectId = string;
  export type ObjectID = string;
}
declare module 'bson' {
  export type ObjectId = string;
  export type ObjectID = string;
}

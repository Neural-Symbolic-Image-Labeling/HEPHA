import { IImageMetaDataSchema, IWorkspaceSchema } from ".";

export interface IImageMetaDataResponse extends Omit<IImageMetaDataSchema, "none"> {
    // url: string;
}

export interface IWorkspaceResponse extends Omit<IWorkspaceSchema, "images">{
    images: IImageMetaDataResponse[];
}
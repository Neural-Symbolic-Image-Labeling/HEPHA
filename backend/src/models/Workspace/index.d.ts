import { Model, ObjectId, Schema } from "mongoose";

export interface IImageLabelSchema {
    name: string[];
    canvasId: string;
    confirmed: boolean;
    mark: { // different for different types of tools, examine property "type" when in use.
        // Properties TBD
        height?: number; // rectangle
        type: string;
        width?: number; // rectangle
        x?: number; // rectangle
        y?: number; // rectangle
    };
}

export interface IImageMetaDataSchema {
    imageId: ObjectId;
    url: string;
    labels: IImageLabelSchema[];
    attributes: {
        width: number;
        height: number;
    };
    name: string;
    canvas: Object | string;
    labeled: boolean;
    manual: boolean;
    trueLabel: string;
}

export interface ILiteralSchema {
    type: string;
    literal: string;
    naturalValue: string;
    locked: boolean;
    deleted: boolean;
}

export interface IClauseSchema {
    literals: ILiteralSchema[];
    locked: boolean;
    deleted: boolean;
}

export interface IStatisticsSchema {
    total: number;
    unlabeled: number;
    manual: number;
    autoLabeled: number;
    accuracy: number;
    label_coverage: any;
}

export interface IRuleSchema {
    name: string;
    clauses: IClauseSchema[];
    locked: boolean;
    deleted: boolean;
}

export interface IRestrictionSchema {
    deleted: any;
    locked: any;
}

export interface IImageCollectionSchema {
    name: string;
    method: "Classification" | "Segmentation";
    images: IImageMetaDataSchema[];
    test: ObjectId[];
    imageOrder: ObjectId[];
    al_imageOrder: ObjectId[];
    statistics: IStatisticsSchema;
    rules: IRuleSchema[];
    restrictions: IRestrictionSchema;
    objectList: string[];
    type: string;
    birdPredicates: any;
    tfidf: any;
}

export interface IWorkspaceSchema {
    name: string;
    collections: IImageCollectionSchema[];
    logs: any[];
}

export declare const ImageMetaDataSchema: Schema<IImageMetaDataSchema>;
export declare const LiteralSchema: Schema<ILiteralSchema>;
export declare const ClauseSchema: Schema<IClauseSchema>;
export declare const ImageLabelSchema: Schema<IImageLabelSchema>;
export declare const StatisticsSchema: Schema<IStatisticsSchema>;
export declare const ImageCollectionSchema: Schema<IImageCollectionSchema>;
export declare const WorkspaceSchema: Schema<IWorkspaceSchema>;
export declare const RuleSchema: Schema<IRuleSchema>;
export declare const RestrictionSchema: Schema<IRestrictionSchema>;

export declare const Workspace: Model<IWorkspaceSchema & Document>;
import { Model, ObjectId, Schema, Mixed } from "mongoose";

export interface IImageSchema { 
    name: string;
    data: string;
    attributes: {
        width: number;
        height: number;
    };
    interpretation: any;
    label: string;
    mask: any;
}

export interface IImageSetSchema {
    name: string;
    images: ObjectId[];
    test: ObjectId[];
    testLabelOptions: string[];
    labelOptions: string[];
    type: 'Medical' | 'Bird' | 'Default';
    tfidf: any;
}

export declare const ImageSchema: Schema<IImageSchema>;
export declare const ImageSetSchema: Schema<IImageSetSchema>;
export declare const ImageSet: Model<IImageSetSchema & Document>;
export declare const Image: Model<IImageSchema & Document>;
export interface LoginRequest {
    workspaceName: string;
}

export interface NewCollectionRequest { 
    setName: string;
    workspaceId: string;
}

export interface AutoLabelRequest {
    workspaceId: string;
    collectionId: string;
    mode: "Classification" | "Segmentation" | "Detection";
    task: "auto" | "trail";
    rule: any;
    active_learning: boolean;
    log: any;
}

export interface SaveLabelStatusRequest { 
    collectionId: string;
    imageId: string;
    labelData: any;
}

export interface UpdateRulesRequest { 
    collectionId: string;
    rules: any;
}

export interface UpdateLabelsRequest { 
    collectionId: string;
    imageIndex: number;
    label: any;
}

export interface UpdateImageMetaDataRequest {
    collectionId: string;
    imgId: string;
    data: any;
}

export interface UpdateStatisticsRequest { 
    collectionId: string;
    data: any;
}

export interface UpdateModeRequest { 
    collectionId: string;
    mode: string;
}

interface GetAccuracySrcImage {
    name: string;
    label: string[];
}

export interface GetAccuracyRequest {
    imgSetName: string;
    srcImages: GetAccuracySrcImage[];
}

export interface BaselineRequest {
    workspaceId: string;
    collectionId: string;
    imgSetName: string;
    task: 'baseline';
    mode: 'Classification' | 'Segmentation' | 'Detection';
    log: any;
}

export interface UpdateLogsRequest { 
    collectionName: string;
    workspaceName: string;
    state: any;
}
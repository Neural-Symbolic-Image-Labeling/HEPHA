export declare class ErrorResponse {
    code: number;
    msg: string;
    errorLog: string;

    /**
     * Public Error Codes:
     * 0 - database error
     * 1 - invalid uuid
     * 2 - request body not found
     */
    constructor(code: number, msg: string, errorLog: any);
}
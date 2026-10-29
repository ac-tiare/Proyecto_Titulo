export const asyncHandler = (handler) => (request, response, next) => {
    void handler(request, response).catch(next);
};

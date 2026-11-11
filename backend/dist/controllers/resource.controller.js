import { resourceService } from '../services/resource.service.js';
import { listResourcesSchema, resourceIdParamsSchema, } from '../validators/resource.validators.js';
export const listResources = async (request, response) => {
    const { category } = listResourcesSchema.parse(request.query);
    response.json({ data: await resourceService.list(category) });
};
export const getResource = async (request, response) => {
    const { id } = resourceIdParamsSchema.parse(request.params);
    response.json({ data: await resourceService.get(id) });
};

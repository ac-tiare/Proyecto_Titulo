import { resourceRepository } from '../repositories/resource.repository.js';
import { AppError } from '../utils/app-error.js';
const categoryFromDatabase = {
    WELLBEING: 'bienestar-emocional',
    WARNING_SIGNS: 'senales-alerta',
    SELF_CARE: 'autocuidado',
    HELP_AND_PREVENTION: 'busqueda-ayuda-prevencion',
};
const categoryToDatabase = {
    'bienestar-emocional': 'WELLBEING',
    'senales-alerta': 'WARNING_SIGNS',
    autocuidado: 'SELF_CARE',
    'busqueda-ayuda-prevencion': 'HELP_AND_PREVENTION',
};
const toResourceView = (resource) => ({
    id: resource.id,
    title: resource.title,
    summary: resource.summary,
    content: resource.content,
    links: resource.links,
    category: categoryFromDatabase[resource.category],
    imageUrl: resource.imageUrl,
    createdAt: resource.createdAt.toISOString(),
});
export const resourceService = {
    async list(category) {
        const resources = await resourceRepository.list(category ? categoryToDatabase[category] : undefined);
        return resources.map((resource) => ({
            ...resource,
            category: categoryFromDatabase[resource.category],
            createdAt: resource.createdAt.toISOString(),
        }));
    },
    async get(id) {
        const resource = await resourceRepository.findById(id);
        if (!resource) {
            throw new AppError(404, 'NOT_FOUND', 'No se encontró el recurso.');
        }
        return toResourceView(resource);
    },
};

import { BaseController } from './index.js';
import { AreaService } from '@/services/area.service.js';

const service = new AreaService();

export default class AreaController extends BaseController {
    getPlayerArea = async () => {
        return service.getOrCreatePlayerArea(this.user.id!);
    };
}

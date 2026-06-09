import * as emiMod from '../../../emi-system/backend/src/routes/emi.js';

const emiRouter = (emiMod as any).default ?? (emiMod as any).emiRouter ?? emiMod;

export default emiRouter;

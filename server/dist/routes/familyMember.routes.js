import { Router } from 'express';
import { getMyFamilyMembers, createFamilyMember, getFamilyMemberById, updateFamilyMember, deleteFamilyMember } from '../controllers/familyMember.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createFamilyMemberSchema, updateFamilyMemberSchema } from '../utils/validators.js';
const router = Router();
// Patient-only family member routes
router.use(authenticate, authorize('patient'));
router.get('/', getMyFamilyMembers);
router.post('/', validate(createFamilyMemberSchema), createFamilyMember);
router.get('/:id', getFamilyMemberById);
router.patch('/:id', validate(updateFamilyMemberSchema), updateFamilyMember);
router.delete('/:id', deleteFamilyMember);
export default router;

import express from 'express';
import { protect } from '../controllers/authController';
import {
  createBoard,
  deleteBoard,
  getBoard,
  getMyBoards,
  updateBoard,
  addPinToBoard,
  removePinFromBoard,
} from '../controllers/boardController';
const router = express.Router();

router.use(protect);

router.get('/my-boards', getMyBoards); // List user's collections
router.post('/', createBoard); // Create a new board (e.g., "Inspiration")
router.get('/:id', getBoard); // Get a board and all pins inside it
router.patch('/:id', updateBoard); // Edit board name/privacy (Secret boards)
router.delete('/:id', deleteBoard);

// Managing Pins inside Boards
router.post('/:id/pins/:pinId', addPinToBoard);
router.delete('/:id/pins/:pinId', removePinFromBoard);

export default router;

import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { usePointYourSuspicions } from "./usePointYourSuspicions";

const mockShowNotification = vi.fn();
vi.mock("../../../components/NotificationContext", () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
  }),
}));

const mockLockGame = vi.fn();
const mockUnlockGame = vi.fn();
vi.mock("../context/GameLogicContext", () => ({
  useGameLock: () => ({
    lockGame: mockLockGame,
    unlockGame: mockUnlockGame,
  }),
}));

const mockStartVotation = vi.fn();
const mockRegisterVotes = vi.fn();
const mockGetSecretCardByPlayer = vi.fn();
const mockRevealSecret = vi.fn();
const mockPlayEventCard = vi.fn();

vi.mock("../../../services/gamePlayerService", () => ({
  createGamePlayerService: () => ({
    startVotation: mockStartVotation,
    registerVotes: mockRegisterVotes,
  }),
}));

vi.mock("../../../services/secretCardService", () => ({
  createSecretCardService: () => ({
    getSecretCardByPlayer: mockGetSecretCardByPlayer,
    revealSecret: mockRevealSecret,
  }),
}));

vi.mock("../../../services/eventService", () => ({
  createEventService: () => ({
    playEventCard: mockPlayEventCard,
  }),
}));

describe("usePointYourSuspicions", () => {
  let wsInstance;
  let setTitleModal,
    setOnSelectPlayer,
    setIsOpenSelectPlayer,
    setPlayers,
    setCardsModal,
    setIsOpenSelectCards,
    setOnSelectCardsModal,
    setAreMySecrets;

  beforeEach(() => {
    vi.resetAllMocks();

    const handlers = {};
    wsInstance = {
      on: vi.fn((event, cb) => (handlers[event] = cb)),
      off: vi.fn(),
      emit: (event, data) => handlers[event]?.(data),
    };

    setTitleModal = vi.fn();
    setOnSelectPlayer = vi.fn();
    setIsOpenSelectPlayer = vi.fn();
    setPlayers = vi.fn();
    setCardsModal = vi.fn();
    setIsOpenSelectCards = vi.fn();
    setOnSelectCardsModal = vi.fn();
    setAreMySecrets = vi.fn();
  });

  const setup = () =>
    renderHook(() =>
      usePointYourSuspicions(
        1,
        2,
        setTitleModal,
        setOnSelectPlayer,
        setIsOpenSelectPlayer,
        setPlayers,
        wsInstance,
        setCardsModal,
        setIsOpenSelectCards,
        setOnSelectCardsModal,
        setAreMySecrets
      )
    );

  it("ejecuta startVotation correctamente", async () => {
    mockStartVotation.mockResolvedValue({ initiator_id: 2 });
    const { result } = setup();

    await act(async () => {
      await result.current.startingVote(10);
    });

    expect(mockStartVotation).toHaveBeenCalledWith(1, 2, 10, { room_id: 1 });
    expect(mockLockGame).toHaveBeenCalled();
  });

  it("maneja error en startVotation", async () => {
    mockStartVotation.mockRejectedValue(new Error("fallo"));
    const { result } = setup();
    await act(async () => {
      await result.current.startingVote(5);
    });
    expect(mockStartVotation).toHaveBeenCalled();
  });

  it("maneja handleVote correctamente solo si currentVoter coincide", async () => {
    mockRegisterVotes.mockResolvedValue({});
    const { result } = setup();

    act(() => {
      wsInstance.emit("startVotation", {
        current_voter_id: 2,
        players: [{ id: 3 }],
        card_id: 7,
      });
    });

    await act(async () => {
      await result.current.handleVote(3);
    });

    expect(mockRegisterVotes).toHaveBeenCalledWith(1, 2, [2, 3], { room_id: 1 });
    expect(setIsOpenSelectPlayer).toHaveBeenCalledWith(false);
  });

  it("maneja error en handleVote", async () => {
    mockRegisterVotes.mockRejectedValue(new Error("Error backend"));
    const { result } = setup();

    act(() => {
      wsInstance.emit("startVotation", {
        current_voter_id: 2,
        players: [],
        card_id: 9,
      });
    });

    await act(async () => {
      await result.current.handleVote(4);
    });

    expect(mockRegisterVotes).toHaveBeenCalled();
  });

  it("maneja evento playerSuspicious con jugador distinto", async () => {
    mockGetSecretCardByPlayer.mockResolvedValue([{ id: 1, is_revealed: false }]);
    setup();

    await act(async () => {
      wsInstance.emit("playerSuspicious", { suspicious_playerId: 99 });
    });

    expect(setIsOpenSelectCards).not.toHaveBeenCalled();
  });

  it("maneja evento playerSuspicious cuando el jugador es el sospechoso y tiene secretos", async () => {
    mockGetSecretCardByPlayer.mockResolvedValue([{ id: 1, is_revealed: false }]);
    setup();

    await act(async () => {
      wsInstance.emit("playerSuspicious", { suspicious_playerId: 2 });
    });

    expect(mockGetSecretCardByPlayer).toHaveBeenCalledWith(2, { room_id: 1 });
    expect(setTitleModal).toHaveBeenCalledWith("Selecciona uno de tus secretos para revelar");
    expect(setOnSelectCardsModal).toHaveBeenCalled();
    expect(setIsOpenSelectCards).toHaveBeenCalledWith(true);
  });

  it("muestra notificación si no hay secretos", async () => {
    mockGetSecretCardByPlayer.mockResolvedValue([{ id: 5, is_revealed: true }]);
    setup();

    await act(async () => {
      wsInstance.emit("playerSuspicious", { suspicious_playerId: 2 });
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      <p>El jugador sospechoso no tiene secretos para revelar</p>,
      "Información",
      2000,
      "info"
    );
    expect(mockUnlockGame).toHaveBeenCalled();
  });

  it("maneja evento currentVoter", () => {
    setup();
    act(() => {
      wsInstance.emit("currentVoter", 7);
    });
  });

  it("maneja evento RegisterVotes", () => {
    setup();
    act(() => {
      wsInstance.emit("RegisterVotes", { end_votation: true });
    });
  });

  it("ejecuta efecto final cuando endVotation y playedCardId e initiatorId coinciden", async () => {
    mockPlayEventCard.mockResolvedValue({});
    mockStartVotation.mockResolvedValue({ initiator_id: 2 });

    const { result } = setup();

    await act(async () => {
      await result.current.startingVote(10);
    });

    act(() => {
      wsInstance.emit("RegisterVotes", { end_votation: true });
    });

    await act(async () => {});

    expect(mockPlayEventCard).toHaveBeenCalledWith(
      10,
      { game_id: 1, player_id: 2, end_votation: true },
      { room_id: 1 }
    );
  });

  it("maneja error al revelar secreto", async () => {
    mockRevealSecret.mockRejectedValue(new Error("fallo"));
    mockGetSecretCardByPlayer.mockResolvedValue([{ id: 3, is_revealed: false }]);

    setup();

    await act(async () => {
      wsInstance.emit("playerSuspicious", { suspicious_playerId: 2 });
    });

    const cbWrapper = setOnSelectCardsModal.mock.lastCall[0];
    const handleSelectFn = cbWrapper();

    await act(async () => {
      await handleSelectFn(3, true);
    });

    expect(mockRevealSecret).toHaveBeenCalledWith(3, true, { room_id: 1 });
    expect(setIsOpenSelectCards).toHaveBeenCalledWith(true);
  });
});

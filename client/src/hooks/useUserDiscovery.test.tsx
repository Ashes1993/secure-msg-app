import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useUserDiscovery } from "./useUserDiscovery";
import { getUser } from "@/actions/users";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createRoom } from "@/actions/room";

vi.mock("@/actions/users", () => ({
  getUser: vi.fn(),
}));

vi.mock("@/actions/room", () => ({
  createRoom: vi.fn(),
}));

const mockedGetUser = vi.mocked(getUser);
const mockedCreateRoom = vi.mocked(createRoom);

// TanStack provider helper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  const TestQueryProviderWrapper = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  TestQueryProviderWrapper.displayName = "TestQueryProviderWrapper";

  return TestQueryProviderWrapper;
};

describe("useUserDiscovery Hook context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should remain idle when the search query is empty", () => {
    const { result } = renderHook(() => useUserDiscovery(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.searchError).toBeNull();
    expect(mockedGetUser).not.toHaveBeenCalled();
  });

  it("should successfully fetch users when a query is provided", async () => {
    mockedGetUser.mockResolvedValueOnce({
      success: true,
      error: null,
      data: [{ id: "1", username: "ashkan", publicKey: "key-xyz" }],
    });

    const { result } = renderHook(() => useUserDiscovery("ashkan"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isSearching).toBe(true);

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(result.current.users).toEqual([
      { id: "1", username: "ashkan", publicKey: "key-xyz" },
    ]);
    expect(result.current.searchError).toBeNull();
  });

  it("should catch and expose errors when the user lookup routine fails", async () => {
    const apiErrorMessage =
      "Unable to complete search request due to a system failure. Please try again shortly.";

    mockedGetUser.mockResolvedValueOnce({
      success: false,
      error: apiErrorMessage,
      data: [],
    });

    const { result } = renderHook(() => useUserDiscovery("error_trigger"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.searchError).toBe(apiErrorMessage);
  });

  it("should execute the room creation successfully when triggered", async () => {
    mockedCreateRoom.mockResolvedValueOnce({
      success: true,
      error: null,
      data: { id: "room-abc-123" },
    });

    const { result } = renderHook(() => useUserDiscovery(""), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.createConversation("target-user-999");
    });

    await waitFor(() => {
      expect(result.current.isCreatingRoom).toBe(false);
    });

    expect(result.current.creationError).toBeNull();
    expect(mockedCreateRoom).toHaveBeenCalledWith("target-user-999");
  });

  it("should securely capture and expose error string during room creation", async () => {
    const roomCreationErrorMessage =
      "Encountered an internal error while building the messaging channel.";

    mockedCreateRoom.mockResolvedValueOnce({
      success: false,
      error: roomCreationErrorMessage,
      data: null,
    });

    const { result } = renderHook(() => useUserDiscovery(""), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.createConversation("target-user-999");
    });

    await waitFor(() => {
      expect(result.current.isCreatingRoom).toBe(false);
    });

    expect(result.current.creationError).toBe(roomCreationErrorMessage);
  });
});

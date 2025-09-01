const UserService = require("../src/service/user-service.js");
const UserRepository = require("../src/repository/user-repository.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

jest.mock("../src/repository/user-repository.js");
jest.mock("jsonwebtoken");
jest.mock("bcrypt");

describe("UserService", () => {
  let userService;
  let mockUser;

  beforeEach(() => {
    userService = new UserService();
    mockUser = { id: 1, email: "test@example.com", password: "hashedpw" };
    jest.clearAllMocks();
  });

  it("should create a user successfully", async () => {
    UserRepository.mockImplementation(() => {
      return {
        create: jest.fn().mockResolvedValue(mockUser),
      };
    });
    userService = new UserService();

    const result = await userService.create({ email: "test@example.com" });

    expect(result).toEqual(mockUser);
  });

  it("should return JWT token when credentials are correct", async () => {
    const fakeToken = "jwt-token";

    UserRepository.mockImplementation(() => {
      return {
        getByEmail: jest.fn().mockResolvedValue(mockUser),
      };
    });
    bcrypt.compareSync.mockReturnValue(true);
    jwt.sign.mockReturnValue(fakeToken);

    userService = new UserService();
    const result = await userService.signin("test@example.com", "plainpw");

    expect(result).toBe(fakeToken);
    expect(bcrypt.compareSync).toHaveBeenCalledWith("plainpw", "hashedpw");
  });

  it("should throw error when password does not match", async () => {
    UserRepository.mockImplementation(() => {
      return {
        getByEmail: jest.fn().mockResolvedValue(mockUser),
      };
    });
    bcrypt.compareSync.mockReturnValue(false);

    userService = new UserService();

    await expect(
      userService.signin("test@example.com", "wrongpw")
    ).rejects.toEqual({ error: "password doesnt match" });
  });

  it("should return user id when token is valid", async () => {
    UserRepository.mockImplementation(() => {
      return {
        getById: jest.fn().mockResolvedValue(mockUser),
      };
    });
    jwt.verify.mockReturnValue({ id: 1 });

    userService = new UserService();

    const result = await userService.isAuthenticated("validtoken");
    expect(result).toBe(1);
  });

  it("should throw error when token is invalid", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    userService = new UserService();

    await expect(userService.isAuthenticated("badtoken")).rejects.toThrow();
  });

  it("should return true when password matches", () => {
    bcrypt.compareSync.mockReturnValue(true);
    const result = userService.checkPassword("plain", "hashed");
    expect(result).toBe(true);
  });

  it("should return false when password does not match", () => {
    bcrypt.compareSync.mockReturnValue(false);
    const result = userService.checkPassword("plain", "hashed");
    expect(result).toBe(false);
  });

  it("should create a token", () => {
    jwt.sign.mockReturnValue("newtoken");
    const token = userService.createtoken({ id: 1 });
    expect(token).toBe("newtoken");
  });

  it("should verify a token", () => {
    jwt.verify.mockReturnValue({ id: 1 });
    const result = userService.verifyToken("sometoken");
    expect(result).toEqual({ id: 1 });
  });
});

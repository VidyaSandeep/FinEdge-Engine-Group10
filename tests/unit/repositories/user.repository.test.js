import { jest } from '@jest/globals';

const mockLean = jest.fn();
const mockPopulate = jest.fn();
const mockSelect = jest.fn();

const mockChain = {
    select: mockSelect,
    populate: mockPopulate,
    lean: mockLean
};

jest.unstable_mockModule('../../../src/models/user.model.js', () => ({
  default: {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn()
  }
}));

const User = (await import('../../../src/models/user.model.js')).default;
const userRepository = await import('../../../src/repositories/user.repository.js');

describe('Repository - User Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        mockSelect.mockReturnValue(mockChain);
        mockPopulate.mockReturnValue(mockChain);
        mockLean.mockResolvedValue(mockDoc);

        User.create.mockImplementation((data) => Promise.resolve(data));
        User.findById.mockReturnValue(mockChain);
        User.findOne.mockReturnValue(mockChain);
        User.findByIdAndUpdate.mockReturnValue(mockChain);
        User.findByIdAndDelete.mockReturnValue(mockChain);
        User.countDocuments.mockImplementation(() => Promise.resolve(0));
    });

    const mockDate = new Date();
    const mockDoc = {
        _id: '1234567890',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate
    };

    const expectedDomain = {
        id: '1234567890',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashedpassword',
        isActive: true,
        preferences: null,
        createdAt: mockDate,
        updatedAt: mockDate
    };

    describe('createUser', () => {
        it('should create and return mapped user', async () => {
            User.create.mockResolvedValue([mockDoc]);
            
            const payload = { name: 'John Doe', email: 'john@example.com', password: 'hashedpassword' };
            const result = await userRepository.createUser(payload);

            expect(User.create).toHaveBeenCalledWith([payload], { session: undefined });
            expect(result).toEqual(expectedDomain);
        });
    });

    describe('findUserById', () => {
        it('should find user by id and return domain object', async () => {
            mockLean.mockResolvedValueOnce(mockDoc);

            const result = await userRepository.findUserById('1234567890');

            expect(User.findById).toHaveBeenCalledWith('1234567890');
            expect(mockPopulate).toHaveBeenCalledWith('preferences');
            expect(result).toEqual(expectedDomain);
        });

        it('should return null if user not found', async () => {
            mockLean.mockResolvedValueOnce(null);

            const result = await userRepository.findUserById('nonexistent');

            expect(result).toBeNull();
        });

        it('should return null if isActive is provided and does not match', async () => {
            mockLean.mockResolvedValueOnce(mockDoc); // mockDoc has isActive: true

            const result = await userRepository.findUserById('1234567890', false);

            expect(result).toBeNull();
        });
    });

    describe('findUserByEmail', () => {
        it('should find user by email, apply lowercase and trim', async () => {
            mockLean.mockResolvedValueOnce(mockDoc);

            const result = await userRepository.findUserByEmail(' JOHN@EXAMPLE.COM ');

            expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
            expect(mockPopulate).toHaveBeenCalledWith('preferences');
            expect(result).toEqual(expectedDomain);
        });

        it('should apply isActive to query if provided', async () => {
            mockLean.mockResolvedValueOnce(mockDoc);

            await userRepository.findUserByEmail('john@example.com', true);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com', isActive: true });
        });
    });

    describe('findUserByEmailWithPassword', () => {
        it('should find user by email and select password', async () => {
            mockLean.mockResolvedValueOnce(mockDoc);
            
            const result = await userRepository.findUserByEmailWithPassword('john@example.com');

            expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
            expect(mockSelect).toHaveBeenCalledWith('+password');
            expect(mockPopulate).toHaveBeenCalledWith('preferences');
            expect(result).toEqual(expectedDomain);
        });
    });

    describe('softDeleteUserById', () => {
        it('should update user to inactive', async () => {
            mockLean.mockResolvedValueOnce({ ...mockDoc, isActive: false });

            const result = await userRepository.softDeleteUserById('1234567890');

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                '1234567890',
                { isActive: false },
                { returnDocument: 'after', runValidators: true }
            );
            expect(result.isActive).toBe(false);
        });
    });

    describe('deleteUserById', () => {
        it('should hard delete user by id', async () => {
            mockLean.mockResolvedValueOnce(mockDoc);

            const result = await userRepository.deleteUserById('1234567890');

            expect(User.findByIdAndDelete).toHaveBeenCalledWith('1234567890', { session: undefined });
            expect(result).toEqual(expectedDomain);
        });
    });

    describe('userExistsByEmail', () => {
        it('should return true if user count > 0', async () => {
            User.countDocuments.mockResolvedValue(1);

            const result = await userRepository.userExistsByEmail(' JOHN@EXAMPLE.COM ');

            expect(User.countDocuments).toHaveBeenCalledWith({ email: 'john@example.com' });
            expect(result).toBe(true);
        });

        it('should return false if user count is 0', async () => {
            User.countDocuments.mockResolvedValue(0);

            const result = await userRepository.userExistsByEmail('john@example.com');

            expect(result).toBe(false);
        });
    });
});

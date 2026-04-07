module.exports = {
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: null })),
      insert: jest.fn(),
    })),
    rpc: jest.fn(() => ({ data: null })),
  },
};

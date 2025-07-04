import { 
  compareAnswers, 
  cleanAnswer, 
  getRandomInsult, 
  getCheekyComment 
} from '../answerValidator';

describe('Answer Validator Module', () => {
  // Silence console logs for cleaner test output
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'group').mockImplementation(() => {});
    jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('cleanAnswer', () => {
    test('should convert to lowercase and trim', () => {
      expect(cleanAnswer('  HELLO WORLD  ')).toBe('hello world');
    });

    test('should remove leading articles', () => {
      expect(cleanAnswer('The Beatles')).toBe('beatles');
      expect(cleanAnswer('A Beautiful Mind')).toBe('beautiful mind');
      expect(cleanAnswer('An Apple')).toBe('apple');
    });

    test('should remove parentheses and contents', () => {
      expect(cleanAnswer('George Washington (1st President)')).toBe('george washington');
      expect(cleanAnswer('Paris (France)')).toBe('paris');
    });

    test('should remove punctuation', () => {
      expect(cleanAnswer('Hello, World!')).toBe('hello world');
      expect(cleanAnswer('Dr. Smith')).toBe('dr smith');
    });

    test('should handle empty or null input', () => {
      expect(cleanAnswer('')).toBe('');
      expect(cleanAnswer(null)).toBe('');
      expect(cleanAnswer(undefined)).toBe('');
    });
  });

  describe('compareAnswers', () => {
    test('should accept exact matches', () => {
      expect(compareAnswers('paris', 'paris')).toBe(true);
      expect(compareAnswers('Paris', 'paris')).toBe(true);
    });

    test('should accept answers with different articles', () => {
      expect(compareAnswers('The Beatles', 'Beatles')).toBe(true);
      expect(compareAnswers('Beatles', 'The Beatles')).toBe(true);
    });

    test('should accept answers with parenthetical content', () => {
      expect(compareAnswers('George Washington', 'George Washington (1st President)')).toBe(true);
    });

    test('should accept partial matches for longer answers', () => {
      expect(compareAnswers('washington', 'George Washington')).toBe(true);
      expect(compareAnswers('george', 'George Washington')).toBe(true);
    });

    test('should handle multiple acceptable answers', () => {
      expect(compareAnswers('JFK', 'John F. Kennedy, JFK')).toBe(true);
      expect(compareAnswers('John F. Kennedy', 'John F. Kennedy, JFK')).toBe(true);
    });

    test('should reject incorrect answers', () => {
      expect(compareAnswers('Lincoln', 'George Washington')).toBe(false);
      expect(compareAnswers('cat', 'dog')).toBe(false);
    });

    test('should accept close matches with minor typos', () => {
      expect(compareAnswers('shakespear', 'shakespeare')).toBe(true);
      expect(compareAnswers('missisipi', 'mississippi')).toBe(true);
    });

    test('should require exact match for very short answers', () => {
      expect(compareAnswers('cat', 'car')).toBe(false);
      expect(compareAnswers('yes', 'yep')).toBe(false);
    });
  });

  describe('getRandomInsult', () => {
    test('should return a string', () => {
      const insult = getRandomInsult();
      expect(typeof insult).toBe('string');
      expect(insult.length).toBeGreaterThan(0);
    });

    test('should return different insults', () => {
      const insults = new Set();
      for (let i = 0; i < 50; i++) {
        insults.add(getRandomInsult());
      }
      // Should have gotten at least a few different insults
      expect(insults.size).toBeGreaterThan(5);
    });
  });

  describe('getCheekyComment', () => {
    test('should return a string', () => {
      const comment = getCheekyComment();
      expect(typeof comment).toBe('string');
      expect(comment.length).toBeGreaterThan(0);
    });

    test('should return different comments', () => {
      const comments = new Set();
      for (let i = 0; i < 50; i++) {
        comments.add(getCheekyComment());
      }
      // Should have gotten at least a few different comments
      expect(comments.size).toBeGreaterThan(3);
    });
  });
});

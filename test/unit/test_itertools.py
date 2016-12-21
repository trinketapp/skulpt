import unittest
import itertools

class IterToolsTestCase(unittest.TestCase):
    def test_permutations(self):
        self.assertEqual(list(itertools.permutations(range(3))),
                         [(0,1,2), (0,2,1), (1,0,2), (1,2,0), (2,0,1), (2,1,0)])

if __name__ == '__main__':
    unittest.main()

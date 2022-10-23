#!/usr/bin/env python3

import sys
import re


def rep(s: str):
  s = re.sub(r' — ', "&mdash;", s)
  s = re.sub(r'—', "&mdash;", s)
  s = re.sub(r'–', "-", s)
  s = re.sub(r'’', "'", s)
  s = re.sub(r'“|”', "\"", s)
  s = re.sub(r'…', "&hellip;", s)
  return s


print(rep(sys.stdin.read()))

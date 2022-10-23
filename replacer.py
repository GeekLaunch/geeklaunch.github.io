#!/usr/bin/env python3

import fileinput
import re


def rep(s: str):
  s = line
  s = re.sub(r' — ', "&mdash;", s)
  s = re.sub(r'—', "&mdash;", s)
  s = re.sub(r'–', "-", s)
  s = re.sub(r'’', "'", s)
  s = re.sub(r'“|”', "\"", s)
  s = re.sub(r'…', "&hellip;", s)
  return s


for line in fileinput.input():
  print(rep(line))

from sys import argv
from json import dumps
from rptag import RobinsonPierpontTag

print (dumps(vars(RobinsonPierpontTag(argv[1]))))
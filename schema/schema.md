### level

- level n: manifest text
- level n: manifest law
- level n: manifest code
- level n+1: manifest schema 
    - schema for law
    - schema for code
- level is entity's internal param
    - map : entity A level n = entity B level m
        - what happen if entity A consider its level n = entity B level m+1, or entity B consider its level m = entity A level n+1
    - map to protocol :
        - protocol X define level 1,2,3.
        - entity A level n = protocol X level 3, so its n-1 = 2, n-2 =1...
        - entity B level m = protocol X level 1, can not understand level 2,3. 
        - or entity A spilit entity A1, entity A level n = entity A1 level 3,...
            - and entity A1 sign protocol X , and share the same levels.
    - map in spilit and joint
        - spilit, joint is protocol
        - entity A spilit into A1 and A2: A level n = A1 level n = A2 level 1, A level n+1 = A1 level n+1 = A2 level 2
            - spilit protocol level 1 = A level 1
            - A1 level 1 = spilit protocol level 1
            - A2 level 1 = spilit protocol level n
        - entity A and B joint to C: A level n = B level m = C level 1.
            - joint protocol level 1 = C level 1
            - A level n = joint protocol level 1
            - B level m = joint protocol level 1

### stage

- level n: text -> level n: law v0 -> level n+1: schema for law v1-> level n: law v1 -> ...
- level n: text -> level n: code v0 -> level n+1: schema foe code v1 -> level n: code v1 -> ...
- level n+1: scheme for law  -> level n+1: schema for code ( skip code v0)
- joint
    - level n: text ->level n: law v0-> level n: code v0-> level n+1: schema for law v1-> level n+1: schema for code v1-> law and code v1
    - or level n: law v0-> level n+1: schema for law v1-> level n+1: schema for code v1-> level n: code v1
    - or level n: law v0-> level n+1: schema for law v1, level n: code v0 -> level n+1: schema for code v1-> level n: code v1
    - ......

### version -> branch + tag

- tag: commit
- branch: comits, a queue of commit
- stage finish:
    - close a task
    - make a tag
    - the next stages -> front
- front -> stage start
    - make a branch
    - make a task

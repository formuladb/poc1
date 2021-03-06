#!/bin/bash 
# Wonder Shaper
#
# Set the following values to somewhat less than your actual download
# and uplink speed. In kilobits. Also set the device that is to be shaped.
# 
# Orginal: bert hubert <ahu@ds9a.nl>, Copyright 2002, Licensed under the GPL
# Fixes: magnific0 (http://www.github.com/magnific0/wondershaper)
#        systemd .service and .conf file by kfgz and cmsigler at aur.archlinux.org

usage()
{
cat << EOF
USAGE: $0 [-hcs] [-a <adapter>] [-d <rate>] [-u <rate>]

Limit the bandwidth of an adapter

OPTIONS:
   -h           Show this message
   -a <adapter> Set the adpter
   -d <rate>    Set maximum download rate (in Kbps)
   -u <rate>    Set maximum upload rate (in Kbps)
   -p           Use presets in /etc/conf.d/wondershaper.conf
   -c           Clear the limits from adapter
   -s           Show the current status of adapter

MODES:
   wondershaper -a <adapter> -d <rate> -u <rate>
   wondershaper -c -a <adapter>
   wondershaper -s -a <adapter>

EXAMPLES:
   wondershaper -a eth0 -d 1024 -u 512
   wondershaper -c -a eth0

EOF
}

DSPEED=
USPEED=
IFACE=
MODE=

while getopts hd:u:a:pcs o
do	case "$o" in
	h)	usage
		exit 1;;
	d)	DSPEED=$OPTARG;;
	u)      USPEED=$OPTARG;;
	a)      IFACE=$OPTARG;;
	p)      MODE="presets";;
	c)      MODE="clear";;
	s)      MODE="status";;
	[?])	usage
		exit 1;;
	esac
done

if [ "$MODE" = "presets" ]
then
    if [ -f /etc/conf.d/wondershaper.conf ]
    then 
	source /etc/conf.d/wondershaper.conf 
    else 
	echo "/etc/conf.d/wondershaper.conf not found"
	exit 1
    fi
fi

if [[ ! -z $MODE ]] && [[ -z $IFACE ]]
then
    echo "Please supply the adapter name for the mode."
    echo ""
    usage
    exit 1
fi

if [ "$MODE" = "status" ]
then
    tc -s qdisc ls dev $IFACE
    tc -s class ls dev $IFACE
    exit
fi

if [ "$MODE" = "clear" ]
then
    tc qdisc del dev $IFACE root    2> /dev/null > /dev/null
    tc qdisc del dev $IFACE ingress 2> /dev/null > /dev/null
    exit
fi

if [[ -z $DSPEED ]] || [[ -z $USPEED ]] || [[ -z $IFACE ]]
then
    usage
    exit 1
fi

# low priority OUTGOING traffic - you can leave this blank if you want
# low priority source netmasks
NOPRIOHOSTSRC=80

# low priority destination netmasks
NOPRIOHOSTDST=

# low priority source ports
NOPRIOPORTSRC=

# low priority destination ports
NOPRIOPORTDST=



###### uplink

# install root CBQ

tc qdisc add dev $IFACE root handle 1: cbq avpkt 1000 bandwidth 10mbit 

# shape everything at $USPEED speed - this prevents huge queues in your
# DSL modem which destroy latency:
# main class

tc class add dev $IFACE parent 1: classid 1:1 cbq rate ${USPEED}kbit \
allot 1500 prio 5 bounded isolated 

# high prio class 1:10:

tc class add dev $IFACE parent 1:1 classid 1:10 cbq rate ${USPEED}kbit \
   allot 1600 prio 1 avpkt 1000

# bulk and default class 1:20 - gets slightly less traffic, 
#  and a lower priority:

tc class add dev $IFACE parent 1:1 classid 1:20 cbq rate $[9*$USPEED/10]kbit \
   allot 1600 prio 2 avpkt 1000

# 'traffic we hate'

tc class add dev $IFACE parent 1:1 classid 1:30 cbq rate $[8*$USPEED/10]kbit \
   allot 1600 prio 2 avpkt 1000

# all get Stochastic Fairness:
tc qdisc add dev $IFACE parent 1:10 handle 10: sfq perturb 10
tc qdisc add dev $IFACE parent 1:20 handle 20: sfq perturb 10
tc qdisc add dev $IFACE parent 1:30 handle 30: sfq perturb 10

# start filters
# TOS Minimum Delay (ssh, NOT scp) in 1:10:
tc filter add dev $IFACE parent 1:0 protocol ip prio 10 u32 \
      match ip tos 0x10 0xff  flowid 1:10

# ICMP (ip protocol 1) in the interactive class 1:10 so we 
# can do measurements & impress our friends:
tc filter add dev $IFACE parent 1:0 protocol ip prio 11 u32 \
        match ip protocol 1 0xff flowid 1:10

# prioritize small packets (<64 bytes)

tc filter add dev $IFACE parent 1: protocol ip prio 12 u32 \
   match ip protocol 6 0xff \
   match u8 0x05 0x0f at 0 \
   match u16 0x0000 0xffc0 at 2 \
   flowid 1:10


# some traffic however suffers a worse fate
for a in $NOPRIOPORTDST
do
	tc filter add dev $IFACE parent 1: protocol ip prio 14 u32 \
	   match ip dport $a 0xffff flowid 1:30
done

for a in $NOPRIOPORTSRC
do
 	tc filter add dev $IFACE parent 1: protocol ip prio 15 u32 \
	   match ip sport $a 0xffff flowid 1:30
done

for a in $NOPRIOHOSTSRC
do
 	tc filter add dev $IFACE parent 1: protocol ip prio 16 u32 \
	   match ip src $a flowid 1:30
done

for a in $NOPRIOHOSTDST
do
 	tc filter add dev $IFACE parent 1: protocol ip prio 17 u32 \
	   match ip dst $a flowid 1:30
done

# rest is 'non-interactive' ie 'bulk' and ends up in 1:20

tc filter add dev $IFACE parent 1: protocol ip prio 18 u32 \
   match ip dst 0.0.0.0/0 flowid 1:20


########## downlink #############
# slow downloads down to somewhat less than the real speed  to prevent 
# queuing at our ISP. Tune to see how high you can set it.
# ISPs tend to have *huge* queues to make sure big downloads are fast
#
# attach ingress policer:

tc qdisc add dev $IFACE handle ffff: ingress

# filter *everything* to it (0.0.0.0/0), drop everything that's
# coming in too fast:

tc filter add dev $IFACE parent ffff: protocol ip prio 50 u32 match ip src \
   0.0.0.0/0 police rate ${DSPEED}kbit burst 10k drop flowid :1

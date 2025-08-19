#![feature(prelude_import)]
#[prelude_import]
use std::prelude::rust_2024::*;
#[macro_use]
extern crate std;
use libp2p::{
    identity, PeerId, Swarm,
    kad::{
        self, Mode, Event as KademliaEvent, QueryResult, BootstrapOk, BootstrapError,
        GetClosestPeersOk, GetClosestPeersError,
    },
    ping::{self, Event as PingEvent},
    swarm::{SwarmEvent, NetworkBehaviour},
    Transport, tcp, yamux, noise, futures::StreamExt,
};
use std::error::Error;
use std::time::Duration;
use tokio::time::interval;
struct MyBehaviour {
    kademlia: kad::Behaviour<kad::store::MemoryStore>,
    ping: ping::Behaviour,
}
///`NetworkBehaviour::ToSwarm` produced by MyBehaviour.
enum MyBehaviourEvent
where
    kad::Behaviour<
        kad::store::MemoryStore,
    >: ::libp2p::swarm::derive_prelude::NetworkBehaviour,
    ping::Behaviour: ::libp2p::swarm::derive_prelude::NetworkBehaviour,
{
    Kademlia(
        <kad::Behaviour<
            kad::store::MemoryStore,
        > as ::libp2p::swarm::derive_prelude::NetworkBehaviour>::ToSwarm,
    ),
    Ping(
        <ping::Behaviour as ::libp2p::swarm::derive_prelude::NetworkBehaviour>::ToSwarm,
    ),
}
impl ::core::fmt::Debug for MyBehaviourEvent
where
    kad::Behaviour<
        kad::store::MemoryStore,
    >: ::libp2p::swarm::derive_prelude::NetworkBehaviour,
    ping::Behaviour: ::libp2p::swarm::derive_prelude::NetworkBehaviour,
    <kad::Behaviour<
        kad::store::MemoryStore,
    > as ::libp2p::swarm::derive_prelude::NetworkBehaviour>::ToSwarm: ::core::fmt::Debug,
    <ping::Behaviour as ::libp2p::swarm::derive_prelude::NetworkBehaviour>::ToSwarm: ::core::fmt::Debug,
{
    fn fmt(
        &self,
        f: &mut std::fmt::Formatter<'_>,
    ) -> std::result::Result<(), std::fmt::Error> {
        match &self {
            MyBehaviourEvent::Kademlia(event) => {
                f.write_fmt(format_args!("{0}: {1:?}", "MyBehaviourEvent", event))
            }
            MyBehaviourEvent::Ping(event) => {
                f.write_fmt(format_args!("{0}: {1:?}", "MyBehaviourEvent", event))
            }
        }
    }
}
impl ::libp2p::swarm::derive_prelude::NetworkBehaviour for MyBehaviour
where
    kad::Behaviour<
        kad::store::MemoryStore,
    >: ::libp2p::swarm::derive_prelude::NetworkBehaviour,
    ping::Behaviour: ::libp2p::swarm::derive_prelude::NetworkBehaviour,
{
    type ConnectionHandler = ::libp2p::swarm::derive_prelude::ConnectionHandlerSelect<
        ::libp2p::swarm::derive_prelude::THandler<
            kad::Behaviour<kad::store::MemoryStore>,
        >,
        ::libp2p::swarm::derive_prelude::THandler<ping::Behaviour>,
    >;
    type ToSwarm = MyBehaviourEvent;
    #[allow(clippy::needless_question_mark)]
    fn handle_pending_inbound_connection(
        &mut self,
        connection_id: ::libp2p::swarm::derive_prelude::ConnectionId,
        local_addr: &::libp2p::swarm::derive_prelude::Multiaddr,
        remote_addr: &::libp2p::swarm::derive_prelude::Multiaddr,
    ) -> std::result::Result<(), ::libp2p::swarm::derive_prelude::ConnectionDenied> {
        ::libp2p::swarm::derive_prelude::NetworkBehaviour::handle_pending_inbound_connection(
            &mut self.kademlia,
            connection_id,
            local_addr,
            remote_addr,
        )?;
        ::libp2p::swarm::derive_prelude::NetworkBehaviour::handle_pending_inbound_connection(
            &mut self.ping,
            connection_id,
            local_addr,
            remote_addr,
        )?;
        Ok(())
    }
    #[allow(clippy::needless_question_mark)]
    fn handle_established_inbound_connection(
        &mut self,
        connection_id: ::libp2p::swarm::derive_prelude::ConnectionId,
        peer: ::libp2p::swarm::derive_prelude::PeerId,
        local_addr: &::libp2p::swarm::derive_prelude::Multiaddr,
        remote_addr: &::libp2p::swarm::derive_prelude::Multiaddr,
    ) -> std::result::Result<
        ::libp2p::swarm::derive_prelude::THandler<Self>,
        ::libp2p::swarm::derive_prelude::ConnectionDenied,
    > {
        Ok(
            ::libp2p::swarm::derive_prelude::ConnectionHandler::select(
                self
                    .kademlia
                    .handle_established_inbound_connection(
                        connection_id,
                        peer,
                        local_addr,
                        remote_addr,
                    )?,
                self
                    .ping
                    .handle_established_inbound_connection(
                        connection_id,
                        peer,
                        local_addr,
                        remote_addr,
                    )?,
            ),
        )
    }
    #[allow(clippy::needless_question_mark)]
    fn handle_pending_outbound_connection(
        &mut self,
        connection_id: ::libp2p::swarm::derive_prelude::ConnectionId,
        maybe_peer: Option<::libp2p::swarm::derive_prelude::PeerId>,
        addresses: &[::libp2p::swarm::derive_prelude::Multiaddr],
        effective_role: ::libp2p::swarm::derive_prelude::Endpoint,
    ) -> std::result::Result<
        ::std::vec::Vec<::libp2p::swarm::derive_prelude::Multiaddr>,
        ::libp2p::swarm::derive_prelude::ConnectionDenied,
    > {
        let mut combined_addresses = ::alloc::vec::Vec::new();
        combined_addresses
            .extend(
                ::libp2p::swarm::derive_prelude::NetworkBehaviour::handle_pending_outbound_connection(
                    &mut self.kademlia,
                    connection_id,
                    maybe_peer,
                    addresses,
                    effective_role,
                )?,
            );
        combined_addresses
            .extend(
                ::libp2p::swarm::derive_prelude::NetworkBehaviour::handle_pending_outbound_connection(
                    &mut self.ping,
                    connection_id,
                    maybe_peer,
                    addresses,
                    effective_role,
                )?,
            );
        Ok(combined_addresses)
    }
    #[allow(clippy::needless_question_mark)]
    fn handle_established_outbound_connection(
        &mut self,
        connection_id: ::libp2p::swarm::derive_prelude::ConnectionId,
        peer: ::libp2p::swarm::derive_prelude::PeerId,
        addr: &::libp2p::swarm::derive_prelude::Multiaddr,
        role_override: ::libp2p::swarm::derive_prelude::Endpoint,
        port_use: ::libp2p::swarm::derive_prelude::PortUse,
    ) -> std::result::Result<
        ::libp2p::swarm::derive_prelude::THandler<Self>,
        ::libp2p::swarm::derive_prelude::ConnectionDenied,
    > {
        Ok(
            ::libp2p::swarm::derive_prelude::ConnectionHandler::select(
                self
                    .kademlia
                    .handle_established_outbound_connection(
                        connection_id,
                        peer,
                        addr,
                        role_override,
                        port_use,
                    )?,
                self
                    .ping
                    .handle_established_outbound_connection(
                        connection_id,
                        peer,
                        addr,
                        role_override,
                        port_use,
                    )?,
            ),
        )
    }
    fn on_connection_handler_event(
        &mut self,
        peer_id: ::libp2p::swarm::derive_prelude::PeerId,
        connection_id: ::libp2p::swarm::derive_prelude::ConnectionId,
        event: ::libp2p::swarm::derive_prelude::THandlerOutEvent<Self>,
    ) {
        match event {
            ::libp2p::swarm::derive_prelude::Either::Left(ev) => {
                ::libp2p::swarm::derive_prelude::NetworkBehaviour::on_connection_handler_event(
                    &mut self.kademlia,
                    peer_id,
                    connection_id,
                    ev,
                )
            }
            ::libp2p::swarm::derive_prelude::Either::Right(ev) => {
                ::libp2p::swarm::derive_prelude::NetworkBehaviour::on_connection_handler_event(
                    &mut self.ping,
                    peer_id,
                    connection_id,
                    ev,
                )
            }
        }
    }
    fn poll(
        &mut self,
        cx: &mut std::task::Context,
    ) -> std::task::Poll<
        ::libp2p::swarm::derive_prelude::ToSwarm<
            Self::ToSwarm,
            ::libp2p::swarm::derive_prelude::THandlerInEvent<Self>,
        >,
    > {
        match ::libp2p::swarm::derive_prelude::NetworkBehaviour::poll(
            &mut self.kademlia,
            cx,
        ) {
            std::task::Poll::Ready(e) => {
                return std::task::Poll::Ready(
                    e
                        .map_out(MyBehaviourEvent::Kademlia)
                        .map_in(|event| ::libp2p::swarm::derive_prelude::Either::Left(
                            event,
                        )),
                );
            }
            std::task::Poll::Pending => {}
        }
        match ::libp2p::swarm::derive_prelude::NetworkBehaviour::poll(
            &mut self.ping,
            cx,
        ) {
            std::task::Poll::Ready(e) => {
                return std::task::Poll::Ready(
                    e
                        .map_out(MyBehaviourEvent::Ping)
                        .map_in(|event| ::libp2p::swarm::derive_prelude::Either::Right(
                            event,
                        )),
                );
            }
            std::task::Poll::Pending => {}
        }
        std::task::Poll::Pending
    }
    fn on_swarm_event(&mut self, event: ::libp2p::swarm::derive_prelude::FromSwarm) {
        self.kademlia.on_swarm_event(event);
        self.ping.on_swarm_event(event);
    }
}
fn main() -> Result<(), Box<dyn Error>> {
    let body = async {
        let local_key = identity::Keypair::generate_ed25519();
        let local_peer_id = PeerId::from(local_key.public());
        {
            ::std::io::_print(format_args!("Local peer ID: {0:?}\n", local_peer_id));
        };
        let transport = tcp::tokio::Transport::new(tcp::Config::default())
            .upgrade(libp2p::core::upgrade::Version::V1)
            .authenticate(noise::Config::new(&local_key)?)
            .multiplex(yamux::Config::default())
            .boxed();
        let mut cfg = kad::Config::default();
        cfg.set_query_timeout(Duration::from_secs(5 * 60));
        let store = kad::store::MemoryStore::new(local_peer_id);
        let mut kademlia = kad::Behaviour::with_config(local_peer_id, store, cfg);
        kademlia.set_mode(Some(Mode::Server));
        let bootstraps = [
            "/ip4/34.197.35.250/tcp/6880",
            "/ip4/72.46.58.63/tcp/51413",
            "/ip4/46.53.251.68/tcp/16970",
            "/ip4/191.95.16.229/tcp/55998",
            "/ip4/79.173.94.111/tcp/1438",
            "/ip4/45.233.86.50/tcp/61995",
            "/ip4/178.162.174.28/tcp/28013",
            "/ip4/178.162.174.240/tcp/28006",
            "/ip4/72.21.17.101/tcp/22643",
            "/ip4/31.181.42.46/tcp/22566",
            "/ip4/67.213.106.46/tcp/61956",
            "/ip4/201.131.172.249/tcp/53567",
            "/ip4/185.203.152.184/tcp/2003",
            "/ip4/68.146.23.207/tcp/42107",
            "/ip4/51.195.222.183/tcp/8653",
            "/ip4/85.17.170.48/tcp/28005",
            "/ip4/87.98.162.88/tcp/6881",
            "/ip4/185.145.245.121/tcp/8656",
            "/ip4/52.201.45.189/tcp/6880",
        ];
        for addr_str in &bootstraps {
            let addr: libp2p::Multiaddr = addr_str.parse()?;
            if let Some(peer_id) = addr
                .iter()
                .find_map(|p| {
                    if let libp2p::multiaddr::Protocol::P2p(peer_id) = p {
                        Some(PeerId::from(peer_id))
                    } else {
                        None
                    }
                })
            {
                kademlia.add_address(&peer_id, addr.clone());
            } else {
                {
                    ::std::io::_print(
                        format_args!(
                            "Warning: Bootstrap address {0} does not contain a PeerId. Adding without explicit peer ID.\n",
                            addr_str,
                        ),
                    );
                };
            }
        }
        let ping = ping::Behaviour::new(
            ping::Config::new().with_interval(Duration::from_secs(10)),
        );
        let behaviour = MyBehaviour { kademlia, ping };
        let mut swarm = Swarm::new(
            transport,
            behaviour,
            local_peer_id,
            libp2p::swarm::Config::with_executor(|fut| {
                tokio::spawn(fut);
            }),
        );
        swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse()?)?;
        let mut bootstrap_timer = interval(Duration::from_secs(10));
        bootstrap_timer.tick().await;
        let mut refresh_timer = interval(Duration::from_secs(60));
        refresh_timer.tick().await;
        let mut bootstrapped = false;
        loop {
            {
                #[doc(hidden)]
                mod __tokio_select_util {
                    pub(super) enum Out<_0, _1, _2> {
                        _0(_0),
                        _1(_1),
                        _2(_2),
                        Disabled,
                    }
                    pub(super) type Mask = u8;
                }
                use ::tokio::macros::support::Future;
                use ::tokio::macros::support::Pin;
                use ::tokio::macros::support::Poll::{Ready, Pending};
                const BRANCHES: u32 = 3;
                let mut disabled: __tokio_select_util::Mask = Default::default();
                if !true {
                    let mask: __tokio_select_util::Mask = 1 << 0;
                    disabled |= mask;
                }
                if !true {
                    let mask: __tokio_select_util::Mask = 1 << 1;
                    disabled |= mask;
                }
                if !true {
                    let mask: __tokio_select_util::Mask = 1 << 2;
                    disabled |= mask;
                }
                let mut output = {
                    let futures_init = (
                        swarm.select_next_some(),
                        bootstrap_timer.tick(),
                        refresh_timer.tick(),
                    );
                    let mut futures = (
                        ::tokio::macros::support::IntoFuture::into_future(
                            futures_init.0,
                        ),
                        ::tokio::macros::support::IntoFuture::into_future(
                            futures_init.1,
                        ),
                        ::tokio::macros::support::IntoFuture::into_future(futures_init.2),
                    );
                    let mut futures = &mut futures;
                    ::tokio::macros::support::poll_fn(|cx| {
                            match ::tokio::macros::support::poll_budget_available(cx) {
                                ::core::task::Poll::Ready(t) => t,
                                ::core::task::Poll::Pending => {
                                    return ::core::task::Poll::Pending;
                                }
                            };
                            let mut is_pending = false;
                            let start = {
                                ::tokio::macros::support::thread_rng_n(BRANCHES)
                            };
                            for i in 0..BRANCHES {
                                let branch;
                                #[allow(clippy::modulo_one)]
                                {
                                    branch = (start + i) % BRANCHES;
                                }
                                match branch {
                                    #[allow(unreachable_code)]
                                    0 => {
                                        let mask = 1 << branch;
                                        if disabled & mask == mask {
                                            continue;
                                        }
                                        let (fut, ..) = &mut *futures;
                                        let mut fut = unsafe { Pin::new_unchecked(fut) };
                                        let out = match Future::poll(fut, cx) {
                                            Ready(out) => out,
                                            Pending => {
                                                is_pending = true;
                                                continue;
                                            }
                                        };
                                        disabled |= mask;
                                        #[allow(unused_variables)] #[allow(unused_mut)]
                                        match &out {
                                            event => {}
                                            _ => continue,
                                        }
                                        return Ready(__tokio_select_util::Out::_0(out));
                                    }
                                    #[allow(unreachable_code)]
                                    1 => {
                                        let mask = 1 << branch;
                                        if disabled & mask == mask {
                                            continue;
                                        }
                                        let (_, fut, ..) = &mut *futures;
                                        let mut fut = unsafe { Pin::new_unchecked(fut) };
                                        let out = match Future::poll(fut, cx) {
                                            Ready(out) => out,
                                            Pending => {
                                                is_pending = true;
                                                continue;
                                            }
                                        };
                                        disabled |= mask;
                                        #[allow(unused_variables)] #[allow(unused_mut)]
                                        match &out {
                                            _ => {}
                                            _ => continue,
                                        }
                                        return Ready(__tokio_select_util::Out::_1(out));
                                    }
                                    #[allow(unreachable_code)]
                                    2 => {
                                        let mask = 1 << branch;
                                        if disabled & mask == mask {
                                            continue;
                                        }
                                        let (_, _, fut, ..) = &mut *futures;
                                        let mut fut = unsafe { Pin::new_unchecked(fut) };
                                        let out = match Future::poll(fut, cx) {
                                            Ready(out) => out,
                                            Pending => {
                                                is_pending = true;
                                                continue;
                                            }
                                        };
                                        disabled |= mask;
                                        #[allow(unused_variables)] #[allow(unused_mut)]
                                        match &out {
                                            _ => {}
                                            _ => continue,
                                        }
                                        return Ready(__tokio_select_util::Out::_2(out));
                                    }
                                    _ => {
                                        ::core::panicking::panic_fmt(
                                            format_args!(
                                                "internal error: entered unreachable code: {0}",
                                                format_args!(
                                                    "reaching this means there probably is an off by one bug",
                                                ),
                                            ),
                                        );
                                    }
                                }
                            }
                            if is_pending {
                                Pending
                            } else {
                                Ready(__tokio_select_util::Out::Disabled)
                            }
                        })
                        .await
                };
                match output {
                    __tokio_select_util::Out::_0(event) => {
                        match event {
                            SwarmEvent::NewListenAddr { address, .. } => {
                                {
                                    ::std::io::_print(
                                        format_args!(
                                            "Node {0} listening on {1:?}\n",
                                            local_peer_id,
                                            address,
                                        ),
                                    );
                                };
                            }
                            SwarmEvent::Behaviour(
                                MyBehaviourEvent::Kademlia(kad_event),
                            ) => {
                                match kad_event {
                                    KademliaEvent::OutboundQueryProgressed { result, .. } => {
                                        match result {
                                            QueryResult::Bootstrap(Ok(BootstrapOk { peer, .. })) => {
                                                {
                                                    ::std::io::_print(
                                                        format_args!("Successfully bootstrapped with {0:?}\n", peer),
                                                    );
                                                };
                                            }
                                            QueryResult::Bootstrap(
                                                Err(BootstrapError::Timeout { .. }),
                                            ) => {
                                                {
                                                    ::std::io::_print(
                                                        format_args!("Bootstrap query timed out\n"),
                                                    );
                                                };
                                            }
                                            QueryResult::GetClosestPeers(
                                                Ok(GetClosestPeersOk { key, peers, .. }),
                                            ) => {
                                                {
                                                    ::std::io::_print(
                                                        format_args!(
                                                            "Found {0} closest peers for {1:?}\n",
                                                            peers.len(),
                                                            key,
                                                        ),
                                                    );
                                                };
                                            }
                                            QueryResult::GetClosestPeers(
                                                Err(GetClosestPeersError::Timeout { key, .. }),
                                            ) => {
                                                {
                                                    ::std::io::_print(
                                                        format_args!(
                                                            "GetClosestPeers query for {0:?} timed out\n",
                                                            key,
                                                        ),
                                                    );
                                                };
                                            }
                                            _ => {}
                                        }
                                    }
                                    KademliaEvent::RoutingUpdated { peer, .. } => {
                                        {
                                            ::std::io::_print(
                                                format_args!("Routing table updated with peer: {0}\n", peer),
                                            );
                                        };
                                    }
                                    _ => {}
                                }
                            }
                            SwarmEvent::Behaviour(MyBehaviourEvent::Ping(ping_event)) => {
                                match ping_event {
                                    PingEvent {
                                        peer,
                                        result: Ok(libp2p::ping::Success::Pong),
                                        ..
                                    } => {
                                        {
                                            ::std::io::_print(
                                                format_args!("Ping succeeded with {0}\n", peer),
                                            );
                                        };
                                    }
                                    PingEvent {
                                        peer,
                                        result: Err(libp2p::ping::Failure::Timeout),
                                        ..
                                    } => {
                                        {
                                            ::std::io::_print(
                                                format_args!("Ping timeout with {0}\n", peer),
                                            );
                                        };
                                    }
                                    PingEvent {
                                        peer,
                                        result: Err(libp2p::ping::Failure::Other { error }),
                                        ..
                                    } => {
                                        {
                                            ::std::io::_print(
                                                format_args!(
                                                    "Ping failed with {0} due to: {1:?}\n",
                                                    peer,
                                                    error,
                                                ),
                                            );
                                        };
                                    }
                                    _ => {}
                                }
                            }
                            SwarmEvent::ConnectionEstablished {
                                peer_id,
                                endpoint,
                                ..
                            } => {
                                {
                                    ::std::io::_print(
                                        format_args!(
                                            "Connection established with {0} at {1:?}\n",
                                            peer_id,
                                            endpoint,
                                        ),
                                    );
                                };
                            }
                            SwarmEvent::ConnectionClosed { peer_id, cause, .. } => {
                                {
                                    ::std::io::_print(
                                        format_args!(
                                            "Connection closed with {0}: {1:?}\n",
                                            peer_id,
                                            cause,
                                        ),
                                    );
                                };
                            }
                            SwarmEvent::OutgoingConnectionError {
                                peer_id,
                                error,
                                ..
                            } => {
                                {
                                    ::std::io::_print(
                                        format_args!(
                                            "Outgoing connection error to {0:?}: {1:?}\n",
                                            peer_id,
                                            error,
                                        ),
                                    );
                                };
                            }
                            SwarmEvent::IncomingConnectionError {
                                local_addr,
                                send_back_addr,
                                error,
                                ..
                            } => {
                                {
                                    ::std::io::_print(
                                        format_args!(
                                            "Incoming connection error from {0} to {1}: {2:?}\n",
                                            send_back_addr,
                                            local_addr,
                                            error,
                                        ),
                                    );
                                };
                            }
                            _ => {}
                        }
                    }
                    __tokio_select_util::Out::_1(_) => {
                        if !bootstrapped {
                            {
                                ::std::io::_print(
                                    format_args!("Starting initial bootstrap...\n"),
                                );
                            };
                            if let Ok(_) = swarm.behaviour_mut().kademlia.bootstrap() {
                                bootstrapped = true;
                            } else {
                                {
                                    ::std::io::_print(
                                        format_args!("Failed to start bootstrap.\n"),
                                    );
                                };
                            }
                        }
                    }
                    __tokio_select_util::Out::_2(_) => {
                        {
                            ::std::io::_print(
                                format_args!("Refreshing peer discovery...\n"),
                            );
                        };
                        swarm.behaviour_mut().kademlia.get_closest_peers(local_peer_id);
                    }
                    __tokio_select_util::Out::Disabled => {
                        ::core::panicking::panic_fmt(
                            format_args!(
                                "all branches are disabled and there is no else branch",
                            ),
                        );
                    }
                    _ => {
                        ::core::panicking::panic_fmt(
                            format_args!(
                                "internal error: entered unreachable code: {0}",
                                format_args!("failed to match bind"),
                            ),
                        );
                    }
                }
            }
        }
    };
    #[allow(
        clippy::expect_used,
        clippy::diverging_sub_expression,
        clippy::needless_return
    )]
    {
        return tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .expect("Failed building the Runtime")
            .block_on(body);
    }
}

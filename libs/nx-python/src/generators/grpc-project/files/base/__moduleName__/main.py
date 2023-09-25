"""
Entry point for gRPC application.
"""
import asyncio
import logging
from concurrent import futures

import grpc

# from grpc_reflection.v1alpha import reflection


async def serve() -> None:
    """
    Starts the gRPC server on the defined host and port.
    """
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))

    try:
        # Replace <your-service> with your actual service definition below
        # SERVICE_NAMES = (
        #     <your-service>.DESCRIPTOR.services_by_name["<service-name>"].full_name,
        #     reflection.SERVICE_NAME,
        # )
        # reflection.enable_server_reflection(SERVICE_NAMES, server)
        # add_<your-service>_to_server(<your-service>(), server)

        server.add_insecure_port("<%= host %>:<%= port %>")
        await server.start()
        logging.info("gRPC server started on %s", "<%= host %>:<%= port %>")

        # Wait for a graceful shutdown signal
        await asyncio.Event().wait()
    except Exception as exc:
        logging.error("Error during gRPC server loop: %s", exc)
    finally:
        # Stop the server gracefully
        await server.stop(None)


if __name__ == "__main__":
    logging.info("Starting gRPC server on %s", "<%= host %>:<%= port %>")
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(serve())
    except KeyboardInterrupt:
        logging.info("Stopping gRPC server gracefully")
    except Exception as exc:
        logging.error("Error during gRPC server startup: %s", exc)

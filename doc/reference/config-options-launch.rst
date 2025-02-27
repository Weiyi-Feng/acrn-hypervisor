.. _launch-config-options:

Launch Configuration Options
##############################

As explained in :ref:`acrn_configuration_tool`, launch configuration files
define post-launched User VM settings. This document describes these option settings.

``user_vm``:
  Specify the User VM ``id`` to the Service VM.

``user_vm_type``:
  Specify the User VM type, such as ``CLEARLINUX``, ``ANDROID``, ``ALIOS``,
  ``PREEMPT-RT LINUX``, ``GENERIC LINUX``, ``WINDOWS``, ``YOCTO``, ``UBUNTU``,
  ``ZEPHYR`` or ``VXWORKS``.

``rtos_type``:
  Specify the User VM Real-time capability: Soft RT, Hard RT, or none of them.

``mem_size``:
  Specify the User VM memory size in megabytes.

``vbootloader``:
  Virtual bootloader type; currently only supports OVMF.

``vuart0``:
  Specify whether the device model emulates the vUART0 (vCOM1); refer to
  :ref:`vuart_config` for details.  If set to ``Enable``, the vUART0 is
  emulated by the device model; if set to ``Disable``, the vUART0 is
  emulated by the hypervisor if it is configured in the scenario XML.

``enable_ptm``:
  Enable the Precision Timing Measurement (PTM) feature.

``usb_xhci``:
  USB xHCI mediator configuration. Input format:
  ``bus#-port#[:bus#-port#: ...]``, e.g.: ``1-2:2-4``.
  Refer to :ref:`usb_virtualization` for details.

``shm_regions``:
  List of shared memory regions for inter-VM communication.

``shm_region`` (a child node of ``shm_regions``):
  Configure the shared memory regions for the current VM, input format:
  ``[hv|dm]:/<shm name>,<shm size in MB>``. Refer to :ref:`ivshmem-hld`
  for details.

``console_vuart``:
  Enable a PCI-based console vUART. Refer to :ref:`vuart_config` for details.

``communication_vuarts``:
  List of PCI-based communication vUARTs. Refer to :ref:`vuart_config` for
  details.

``communication_vuart`` (a child node of ``communication_vuarts``):
  Enable a PCI-based communication vUART with its ID. Refer to
  :ref:`vuart_config` for details.

``passthrough_devices``:
  Select the passthrough device from the PCI device list. Currently we support:
  ``usb_xdci``, ``audio``, ``audio_codec``, ``ipu``, ``ipu_i2c``,
  ``cse``, ``wifi``, ``bluetooth``, ``sd_card``,
  ``ethernet``, ``sata``, and ``nvme``.

``network`` (a child node of ``virtio_devices``):
  The virtio network device setting.
  Input format: ``<device_name>[,vhost][,mac=<XX:XX:XX:XX:XX:XX>]``.
  The ``<device_name>`` is the name of the TAP (or MacVTap) device.
  It must include the keyword ``tap``. ``vhost`` specifies the
  vhost backend; otherwise, the VBSU backend is used. The ``mac``
  address is optional.

``block`` (a child node of ``virtio_devices``):
  The virtio block device setting.
  Input format: ``[blk partition:][img path]`` e.g.: ``/dev/sda3:./a/b.img``.

``console`` (a child node of ``virtio_devices``):
  The virtio console device setting.
  Input format:
  ``[@]stdio|tty|pty|sock:portname[=portpath][,[@]stdio|tty|pty:portname[=portpath]]``.

``cpu_affinity``:
  A comma-separated list of Service VM vCPUs assigned to this VM. A Service VM vCPU is identified
  by its lapic ID.

.. note::

   The ``configurable`` and ``readonly`` attributes are used to mark
   whether the item is configurable for users. When ``configurable="n"``
   and ``readonly="y"``, the item is not configurable from the web
   interface. When ``configurable="n"``, the item does not appear on the
   interface.
